"""Integration check against a disposable database on the docker-compose Postgres (see conftest.py)."""

import asyncio
import json
import uuid

import pytest
from fastapi.testclient import TestClient
from mcp import Client

from main import app
from app.mcp_server import mcp

api = TestClient(app)
pytestmark = pytest.mark.usefixtures('test_database')


def test_end_to_end():
    handle = f"test_{uuid.uuid4().hex[:8]}"
    r = api.post("/api/v1/tables/accounts", json={"platform": "youtube", "account_type": "channel", "handle": handle})
    assert r.status_code == 201, r.text
    acc = r.json()["data"]["account_id"]
    try:
        # errors map to sensible status codes
        nope = api.get("/api/v1/tables/nope")
        assert nope.status_code == 404 and nope.json() == {"code": 404, "msg": "unknown table or view: nope", "data": None}
        assert api.post("/api/v1/tables/accounts", json={"platform": "myspace", "account_type": "channel",
                                                      "handle": "x"}).status_code == 400
        assert api.post("/api/v1/tables/accounts", json={"platform": "youtube", "account_type": "channel",
                                                      "handle": handle}).status_code == 409
        assert api.delete("/api/v1/tables/content_tags", params={"content_id": 1}).status_code == 400  # partial key
        assert api.post("/api/v1/tables/v_content_summary", json={}).status_code == 400  # views are read-only

        # content sync: upsert + metrics by key or GUI label, full snapshot marks missing as deleted
        items = [{"external_id": f"{handle}-a", "content_type": "video", "title": "A",
                  "metrics": {"views": 100, "Likes": 10, "bogus": 1}},
                 {"external_id": f"{handle}-b", "content_type": "short", "metrics": {"views": 50}}]
        s = api.post("/api/v1/sync/content", json={"account_id": acc, "items": items}).json()["data"]
        assert (s["content_upserted"], s["facts_inserted"], s["unknown_metrics"]) == (2, 3, ["bogus"])
        s = api.post("/api/v1/sync/content", json={"account_id": acc, "full_snapshot": True, "items": [
            {"external_id": f"{handle}-a", "metrics": {"views": 150}}], "default_content_type": "video"}).json()["data"]
        assert s["marked_deleted"] == 1
        summary = api.get("/api/v1/tables/v_content_summary", params={"account_id": acc, "order_by": "views"}).json()["data"]
        assert summary["total"] == 2 and summary["rows"][0]["views"] == 150

        # filters, update, composite-key create/delete
        cid = api.get("/api/v1/tables/content_items", params={"account_id": acc, "title__like": "a"}).json()["data"]["rows"][0]["content_id"]
        assert api.patch("/api/v1/tables/content_items", params={"content_id": cid},
                         json={"visibility": "public"}).json()["data"]["visibility"] == "public"
        tag = {"content_id": cid, "tag_type": "hashtag", "value": "a,b"}
        assert api.post("/api/v1/tables/content_tags", json=tag).status_code == 201
        assert api.delete("/api/v1/tables/content_tags", params=tag).status_code == 200

        # relationships: second full snapshot without bob infers an unfollow
        people = [{"handle": f"{handle}_alice"}, {"handle": f"{handle}_bob"}]
        assert api.post("/api/v1/sync/relationships", json={"account_id": acc, "relation": "subscriber",
                                                         "people": people}).json()["data"]["new"] == 2
        s = api.post("/api/v1/sync/relationships", json={"account_id": acc, "relation": "subscriber",
                                                      "people": people[:1]}).json()["data"]
        assert (s["new"], s["ended_inferred"]) == (0, 1)
        gone = api.get("/api/v1/tables/v_inferred_unfollows", params={"account_id": acc}).json()["data"]["rows"]
        assert [g["handle"] for g in gone] == [f"{handle}_bob"]

        # CSV imports in the shape of YouTube Studio exports
        chart = "Date,Views,Watch time (hours),Subscribers\nTotal,30,3,2\n2026-10-01,10,1.5,1\n\"Oct 2, 2026\",\"1,200\",2,1\n"
        s = api.post("/api/v1/imports", data={"account_id": acc, "kind": "account_metrics"},
                     files={"file": ("chart.csv", chart)}).json()["data"]
        assert s["facts_inserted"] == 6, s
        series = api.get("/api/v1/dashboard/timeseries", params={"account_id": acc, "metric_key": "views"}).json()["data"]
        assert [p["value"] for p in series] == [10, 1200]
        content = f"Content,Video title,Video publish time,Duration,Views,Likes\nTotal,,,,99,9\n{handle}-c,\"Hi, there\",\"Oct 1, 2026\",61,42,4\n"
        s = api.post("/api/v1/imports", data={"account_id": acc, "kind": "content", "default_content_type": "video"},
                     files={"file": ("content.csv", content)}).json()["data"]
        assert (s["content_upserted"], s["facts_inserted"]) == (1, 2), s

        # preview gives exact counts and stores nothing; 'auto' tells the two CSV shapes apart
        before = api.get("/api/v1/tables/import_batches", params={"account_id": acc}).json()["data"]["total"]
        p = api.post("/api/v1/imports/preview", data={"account_id": acc},
                     files={"file": ("chart.csv", chart)}).json()["data"]
        assert p["kind"] == "account_metrics" and p["result"]["facts_inserted"] == 6 and p["already_imported_at"], p
        assert api.get("/api/v1/tables/import_batches", params={"account_id": acc}).json()["data"]["total"] == before
        assert api.post("/api/v1/imports/preview", data={"account_id": acc, "default_content_type": "video"},
                        files={"file": ("content.csv", content)}).json()["data"]["kind"] == "content"
        assert api.post("/api/v1/imports/preview", data={"account_id": acc},
                        files={"file": ("x.csv", "a,b\n1,2\n")}).status_code == 400

        s = api.post("/api/v1/sync/revenue", json={"account_id": acc, "rows": [
            {"metric": "Estimated revenue", "revenue_source": "ads", "value": 12.5, "currency": "USD",
             "period_start": "2026-09-01", "period_end": "2026-09-30"}, {"metric": "nope", "revenue_source": "ads",
             "value": 1, "period_start": "2026-09-01"}]}).json()["data"]
        assert (s["facts_inserted"], s["unknown_metrics"]) == (1, ["nope"]), s

        ov = next(o for o in api.get("/api/v1/dashboard/overview").json()["data"] if o["account_id"] == acc)
        assert ov["content_count"] == 2 and ov["total_views"] == 242

        expiring = api.get("/api/v1/dashboard/expiring").json()["data"]
        assert isinstance(expiring, list)

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
                # brief drafting: the posts still missing one, the vocabulary in use, and the prompt
                res = await c.call_tool("posts_needing_briefs", {"account_id": acc})
                assert not res.is_error, res
                need = res.structured_content or json.loads(res.content[0].text)
                assert {"posts", "vocabulary", "enums"} <= set(need) and "hook_type" in need["vocabulary"]
                assert all(p["account_id"] == acc for p in need["posts"]) and len(need["posts"]) == 2  # a and c; b was marked removed
                prompt = await c.get_prompt("draft_briefs", {"account_id": str(acc)})
                assert "needs_review" in prompt.messages[0].content.text
        asyncio.run(via_mcp())
        assert api.get("/api/v1/tables/accounts", params={"account_id": acc}).json()["data"]["rows"][0]["display_name"] == "Via MCP"
    finally:
        assert api.delete("/api/v1/tables/accounts", params={"account_id": acc}).status_code == 200
        api.get("/api/v1/tables/people")  # people are global; remove test ones
        for p in api.get("/api/v1/tables/people", params={"handle__like": handle}).json()["data"]["rows"]:
            api.delete("/api/v1/tables/people", params={"person_id": p["person_id"]})


def test_content_briefs():
    handle = f"test_{uuid.uuid4().hex[:8]}"
    acc = api.post("/api/v1/tables/accounts", json={"platform": "tiktok", "account_type": "creator",
                                                   "handle": handle}).json()["data"]["account_id"]
    try:
        api.post("/api/v1/sync/content", json={"account_id": acc, "items": [
            {"external_id": f"{handle}-a", "content_type": "short", "caption": "hello", "metrics": {"views": 200, "likes": 20}}]})
        cid = api.get("/api/v1/tables/content_items", params={"account_id": acc}).json()["data"]["rows"][0]["content_id"]
        perf = lambda: api.get("/api/v1/tables/v_content_performance", params={"content_id": cid}).json()["data"]["rows"]
        assert perf()[0]["brief_count"] == 0 and perf()[0]["brief_id"] is None  # posts without a brief still listed

        v1 = api.post("/api/v1/tables/content_briefs", json={"content_id": cid, "hook_type": "question",
                                                            "main_points": ["a", "b"], "content_format": "tutorial"})
        assert v1.status_code == 201, v1.text
        assert v1.json()["data"]["active_from"]  # defaulted, so per-version metrics stay possible later
        v2 = api.post("/api/v1/tables/content_briefs", json={"content_id": cid, "hook_type": "bold claim"}).json()["data"]

        [row] = perf()
        assert (row["brief_id"], row["hook_type"], row["brief_count"]) == (v2["brief_id"], "bold claim", 2)
        assert (row["caption_length"], row["views"], row["engagement_rate"]) == (5, 200, 0.1)
        assert api.get("/api/v1/tables/content_briefs", params={"brief_id": v1.json()["data"]["brief_id"]}
                       ).json()["data"]["rows"][0]["main_points"] == ["a", "b"]

        # experiment fields: a hypothesis and its verdict, visible on the performance row
        assert api.patch("/api/v1/tables/content_briefs", params={"brief_id": v2["brief_id"]}, json={
            "hypothesis": "bold claims beat questions", "verdict": "confirmed"}).status_code == 200
        assert (perf()[0]["hypothesis"], perf()[0]["verdict"], perf()[0]["visibility"]) == ("bold claims beat questions", "confirmed", "unknown")
        assert api.patch("/api/v1/tables/content_briefs", params={"brief_id": v2["brief_id"]}, json={"verdict": "maybe"}).status_code == 400
        assert api.post("/api/v1/tables/content_briefs", json={"content_id": cid, "content_format": "nope"}).status_code == 400
        assert api.post("/api/v1/tables/content_briefs", json={"content_id": cid, "audio_quality": 9}).status_code == 409

        # a re-sync never touches the hand-written brief
        api.post("/api/v1/sync/content", json={"account_id": acc, "items": [
            {"external_id": f"{handle}-a", "content_type": "short", "metrics": {"views": 300}}]})
        assert perf()[0]["hook_type"] == "bold claim" and perf()[0]["views"] == 300

        # follower lift: publish day + 2 days of daily net followers, split between posts sharing the window
        assert perf()[0]["followers_3d"] is None  # no publish date, no daily data
        api.post("/api/v1/sync/content", json={"account_id": acc, "items": [
            {"external_id": f"{handle}-a", "content_type": "short", "published_at": "2026-03-01"},
            {"external_id": f"{handle}-b", "content_type": "short", "published_at": "2026-03-02"},
            {"external_id": f"{handle}-c", "content_type": "short", "published_at": "2026-03-20"}]})
        days = [{"metric": "net_followers", "period_start": f"2026-03-0{d}", "value": v} for d, v in ((1, 6), (2, 2), (3, 4), (4, 100))]
        assert api.post("/api/v1/sync/account-metrics", json={"account_id": acc, "rows": days}).status_code == 200
        lift = {r["title"] or r["content_id"]: (r["followers_3d"], r["followers_3d_posts"]) for r in
                api.get("/api/v1/tables/v_content_performance", params={"account_id": acc}).json()["data"]["rows"]}
        by_id = {r["external_id"]: r["content_id"] for r in
                 api.get("/api/v1/tables/content_items", params={"account_id": acc}).json()["data"]["rows"]}
        assert lift[by_id[f"{handle}-a"]] == (6, 2)  # (6+2+4) / 2 posts
        assert lift[by_id[f"{handle}-b"]] == (53, 2)  # (2+4+100) / 2 posts
        assert lift[by_id[f"{handle}-c"]] == (None, 1)  # days not saved: unknown, not 0

        # a planned post (draft with a placeholder id) linked to the real one: its brief moves, the plan goes
        draft = api.post("/api/v1/tables/content_items", json={"account_id": acc, "platform": "tiktok", "content_type": "short",
                                                              "external_id": f"draft-{handle}", "visibility": "draft"}).json()["data"]
        plan = api.post("/api/v1/tables/content_briefs", json={"content_id": draft["content_id"], "hypothesis": "h"}).json()["data"]
        planned = api.get("/api/v1/tables/v_content_performance", params={"content_id": draft["content_id"]}).json()["data"]["rows"][0]
        assert (planned["visibility"], planned["hypothesis"]) == ("draft", "h")
        real = by_id[f"{handle}-c"]
        assert api.patch("/api/v1/tables/content_briefs", params={"brief_id": plan["brief_id"]},
                         json={"content_id": real, "active_from": "2026-03-20T00:00:00Z"}).status_code == 200
        assert api.delete("/api/v1/tables/content_items", params={"content_id": draft["content_id"]}).status_code == 200
        moved = api.get("/api/v1/tables/v_content_performance", params={"content_id": real}).json()["data"]["rows"][0]
        assert (moved["brief_id"], moved["hypothesis"]) == (plan["brief_id"], "h")

        api.delete("/api/v1/tables/content_items", params={"content_id": cid})
        assert api.get("/api/v1/tables/content_briefs", params={"content_id": cid}).json()["data"]["total"] == 0
    finally:
        api.delete("/api/v1/tables/accounts", params={"account_id": acc})
