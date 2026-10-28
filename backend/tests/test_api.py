"""Integration check against the docker-compose Postgres: `uv run pytest`."""

import asyncio
import json
import uuid

from fastapi.testclient import TestClient
from mcp import Client

from app.main import app
from app.mcp_server import mcp

api = TestClient(app)


def test_end_to_end():
    handle = f"test_{uuid.uuid4().hex[:8]}"
    r = api.post("/api/tables/accounts", json={"platform": "youtube", "account_type": "channel", "handle": handle})
    assert r.status_code == 201, r.text
    acc = r.json()["account_id"]
    try:
        # errors map to sensible status codes
        assert api.get("/api/tables/nope").status_code == 404
        assert api.post("/api/tables/accounts", json={"platform": "myspace", "account_type": "channel",
                                                      "handle": "x"}).status_code == 400
        assert api.post("/api/tables/accounts", json={"platform": "youtube", "account_type": "channel",
                                                      "handle": handle}).status_code == 409
        assert api.delete("/api/tables/content_tags", params={"content_id": 1}).status_code == 400  # partial key
        assert api.post("/api/tables/v_content_summary", json={}).status_code == 400  # views are read-only

        # content sync: upsert + metrics by key or GUI label, full snapshot marks missing as deleted
        items = [{"external_id": f"{handle}-a", "content_type": "video", "title": "A",
                  "metrics": {"views": 100, "Likes": 10, "bogus": 1}},
                 {"external_id": f"{handle}-b", "content_type": "short", "metrics": {"views": 50}}]
        s = api.post("/api/sync/content", json={"account_id": acc, "items": items}).json()
        assert (s["content_upserted"], s["facts_inserted"], s["unknown_metrics"]) == (2, 3, ["bogus"])
        s = api.post("/api/sync/content", json={"account_id": acc, "full_snapshot": True, "items": [
            {"external_id": f"{handle}-a", "metrics": {"views": 150}}], "default_content_type": "video"}).json()
        assert s["marked_deleted"] == 1
        summary = api.get("/api/tables/v_content_summary", params={"account_id": acc, "order_by": "views"}).json()
        assert summary["total"] == 2 and summary["rows"][0]["views"] == 150

        # filters, update, composite-key create/delete
        cid = api.get("/api/tables/content_items", params={"account_id": acc, "title__like": "a"}).json()["rows"][0]["content_id"]
        assert api.patch("/api/tables/content_items", params={"content_id": cid},
                         json={"visibility": "public"}).json()["visibility"] == "public"
        tag = {"content_id": cid, "tag_type": "hashtag", "value": "a,b"}
        assert api.post("/api/tables/content_tags", json=tag).status_code == 201
        assert api.delete("/api/tables/content_tags", params=tag).status_code == 200

        # relationships: second full snapshot without bob infers an unfollow
        people = [{"handle": f"{handle}_alice"}, {"handle": f"{handle}_bob"}]
        assert api.post("/api/sync/relationships", json={"account_id": acc, "relation": "subscriber",
                                                         "people": people}).json()["new"] == 2
        s = api.post("/api/sync/relationships", json={"account_id": acc, "relation": "subscriber",
                                                      "people": people[:1]}).json()
        assert (s["new"], s["ended_inferred"]) == (0, 1)
        gone = api.get("/api/tables/v_inferred_unfollows", params={"account_id": acc}).json()["rows"]
        assert [g["handle"] for g in gone] == [f"{handle}_bob"]

        # CSV imports in the shape of YouTube Studio exports
        chart = "Date,Views,Watch time (hours),Subscribers\nTotal,30,3,2\n2026-10-01,10,1.5,1\n\"Oct 2, 2026\",\"1,200\",2,1\n"
        s = api.post("/api/import/csv", data={"account_id": acc, "kind": "account_metrics"},
                     files={"file": ("chart.csv", chart)}).json()
        assert s["facts_inserted"] == 6, s
        series = api.get("/api/dashboard/timeseries", params={"account_id": acc, "metric_key": "views"}).json()
        assert [p["value"] for p in series] == [10, 1200]
        content = f"Content,Video title,Video publish time,Duration,Views,Likes\nTotal,,,,99,9\n{handle}-c,\"Hi, there\",\"Oct 1, 2026\",61,42,4\n"
        s = api.post("/api/import/csv", data={"account_id": acc, "kind": "content", "default_content_type": "video"},
                     files={"file": ("content.csv", content)}).json()
        assert (s["content_upserted"], s["facts_inserted"]) == (1, 2), s

        ov = next(o for o in api.get("/api/dashboard/overview").json() if o["account_id"] == acc)
        assert ov["content_count"] == 2 and ov["total_views"] == 242

        # MCP tools, in-process
        async def via_mcp():
            async with Client(mcp, raise_exceptions=True) as c:
                tools = {t.name for t in (await c.list_tools()).tools}
                assert {"describe_schema", "read_rows", "create_rows", "update_row", "delete_row",
                        "sync_content", "sync_relationships"} <= tools
                res = await c.call_tool("read_rows", {"table": "accounts", "filters": {"handle": handle}})
                assert not res.is_error, res
                data = res.structured_content or json.loads(res.content[0].text)
                assert data["rows"][0]["account_id"] == acc
                res = await c.call_tool("update_row", {"table": "accounts", "key": {"account_id": acc},
                                                       "data": {"display_name": "Via MCP"}})
                assert not res.is_error, res
                bad = await c.call_tool("read_rows", {"table": "nope"})
                assert bad.is_error
        asyncio.run(via_mcp())
        assert api.get("/api/tables/accounts", params={"account_id": acc}).json()["rows"][0]["display_name"] == "Via MCP"
    finally:
        assert api.delete("/api/tables/accounts", params={"account_id": acc}).status_code == 200
        api.get("/api/tables/people")  # people are global; remove test ones
        for p in api.get("/api/tables/people", params={"handle__like": handle}).json()["rows"]:
            api.delete("/api/tables/people", params={"person_id": p["person_id"]})
