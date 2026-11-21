<#
Probe every Instagram Graph API endpoint the configured token can reach.

Reads META_GRAPH_VERSION, INSTAGRAM_USER_ID and INSTAGRAM_ACCESS_TOKEN from backend/.env, calls each endpoint,
prints one line per check and saves every raw response (token redacted) to -OutDir.

Usage (from backend/):  powershell -ExecutionPolicy Bypass -File scripts/probe_instagram.ps1 [-OutDir path] [-MaxMedia 5]

Status values:
  OK        HTTP 200 with data
  EMPTY     HTTP 200 but no data (no posts yet, or below the 100-follower threshold)
  EXPECTED  failed as expected (removed metric or permission we deliberately don't have)
  FAIL      unexpected error
#>
param(
    [string]$OutDir = (Join-Path $env:TEMP 'instagram-probe'),
    [int]$MaxMedia = 5
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$envFile = Join-Path $PSScriptRoot '..\.env'
$cfg = @{}
Get-Content $envFile | Where-Object { $_ -match '^[A-Z_]+=' } | ForEach-Object { $k, $v = $_ -split '=', 2; $cfg[$k] = $v.Trim() }
foreach ($k in 'META_GRAPH_VERSION', 'INSTAGRAM_USER_ID', 'INSTAGRAM_ACCESS_TOKEN') {
    if (-not $cfg[$k]) { throw "Missing $k in $envFile" }
}
$token = $cfg.INSTAGRAM_ACCESS_TOKEN
$root = "https://graph.facebook.com/$($cfg.META_GRAPH_VERSION)"
$ig = $cfg.INSTAGRAM_USER_ID
New-Item -ItemType Directory -Force $OutDir | Out-Null

$results = New-Object System.Collections.Generic.List[object]
$script:lastUsage = $null

function Invoke-Graph([string]$Path) {
    $sep = if ($Path.Contains('?')) { '&' } else { '?' }
    $url = "$root/$Path${sep}access_token=$token"
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing
        $usage = $r.Headers['X-Business-Use-Case-Usage']
        if (-not $usage) { $usage = $r.Headers['X-App-Usage'] }
        if ($usage) { $script:lastUsage = $usage }
        return @{ Status = 200; Body = $r.Content }
    } catch {
        $resp = $_.Exception.Response
        if (-not $resp) { return @{ Status = 0; Body = $_.Exception.Message } }
        $body = (New-Object IO.StreamReader($resp.GetResponseStream())).ReadToEnd()
        return @{ Status = [int]$resp.StatusCode; Body = $body }
    }
}

function Test-Endpoint([string]$Group, [string]$Name, [string]$Path, [switch]$ExpectFail) {
    $r = Invoke-Graph $Path
    $body = $r.Body -replace [regex]::Escape($token), '<TOKEN>'
    $json = $null; try { $json = $body | ConvertFrom-Json } catch {}
    $file = Join-Path $OutDir ((($Group + '__' + $Name) -replace '[^\w\-]', '_') + '.json')
    "// GET /$Path`n// HTTP $($r.Status)`n$body" | Set-Content -Encoding utf8 $file

    $status = 'OK'; $detail = ''
    if ($r.Status -ne 200) {
        $status = if ($ExpectFail) { 'EXPECTED' } else { 'FAIL' }
        $detail = if ($json -and $json.error) { $json.error.message } else { $body }
    } elseif ($ExpectFail) {
        $status = 'OK'; $detail = 'expected a failure but it worked'
    } elseif ($json -and ($json.PSObject.Properties.Name -contains 'data') -and @($json.data).Count -eq 0) {
        $status = 'EMPTY'
    } else {
        $detail = Get-Summary $json
    }
    if ($detail.Length -gt 110) { $detail = $detail.Substring(0, 110) + '...' }
    $results.Add([pscustomobject]@{ Group = $Group; Check = $Name; Status = $status; Detail = $detail })
    return $json
}

function Get-Summary($json) {
    if (-not $json) { return '' }
    if ($json.data -and $json.data[0].name) {
        return (@($json.data) | ForEach-Object {
            $v = if ($_.total_value) { $_.total_value.value } elseif ($_.values) { ($_.values | ForEach-Object { $_.value }) -join ',' } else { '?' }
            $b = ''
            if ($_.total_value.breakdowns -and $_.total_value.breakdowns[0].results) {
                $b = ' [' + ((@($_.total_value.breakdowns[0].results) | ForEach-Object { ($_.dimension_values -join '/') + '=' + $_.value }) -join ' ') + ']'
            }
            "$($_.name)=$v$b"
        }) -join '; '
    }
    if ($json.data) { return "$(@($json.data).Count) item(s)" }
    return (($json.PSObject.Properties | Where-Object { $_.Name -notin 'paging' } | ForEach-Object {
        $val = "$($_.Value)"; if ($val.Length -gt 25) { $val = $val.Substring(0, 25) + '..' }; "$($_.Name)=$val"
    }) -join ' ')
}

# Day windows. Instagram buckets days in Pacific time and labels each day by the moment it ENDS (end_time, i.e.
# the next midnight in America/Los_Angeles: 08:00 UTC in winter, 07:00 UTC in summer). A query returns the sum of
# every day whose end_time lies in [since, until], both ends INCLUSIVE. So:
#   one day      -> since = until = that day's end_time
#   last N days  -> since = end_time of the first day, until = end_time of the last day
# Any timestamp that is not a day boundary is rejected with HTTP 400.
$pacific = [TimeZoneInfo]::FindSystemTimeZoneById('Pacific Standard Time')
function Get-DayEnd([int]$DaysAgo) {
    # end_time of the Pacific day that ended $DaysAgo days ago (0 = the day that ended at the last midnight)
    $nowPt = [TimeZoneInfo]::ConvertTimeFromUtc((Get-Date).ToUniversalTime(), $pacific)
    $midnight = [datetime]::SpecifyKind($nowPt.Date.AddDays(-$DaysAgo), 'Unspecified')
    [DateTimeOffset]::new([TimeZoneInfo]::ConvertTimeToUtc($midnight, $pacific)).ToUnixTimeSeconds()
}
$d0 = Get-DayEnd 0            # yesterday (Pacific)
$w7 = Get-DayEnd 6            # first of the last 7 days
$w30 = Get-DayEnd 29          # first of the last 30 days

Write-Host "Probing $root/$ig  ->  raw responses in $OutDir`n"

# --- Token ------------------------------------------------------------------------------------------------------
Test-Endpoint 'token' 'me' 'me?fields=id,name' | Out-Null
Test-Endpoint 'token' 'permissions' 'me/permissions' | Out-Null

# --- Account fields and edges ------------------------------------------------------------------------------------
Test-Endpoint 'account' 'profile' "$ig`?fields=id,username,name,biography,website,profile_picture_url,followers_count,follows_count,media_count" | Out-Null
$media = Test-Endpoint 'account' 'media' "$ig/media?fields=id,caption,media_type,media_product_type,timestamp,permalink,like_count,comments_count&limit=$MaxMedia"
$stories = Test-Endpoint 'account' 'stories' "$ig/stories?fields=id,media_type,media_product_type,timestamp,permalink"
Test-Endpoint 'account' 'live_media' "$ig/live_media?fields=id,media_type,timestamp" | Out-Null
Test-Endpoint 'account' 'business_discovery' "$ig`?fields=business_discovery.username(instagram){username,followers_count,media_count,media.limit(1){id,media_type,like_count,comments_count}}" | Out-Null
Test-Endpoint 'account' 'tags (needs extra permission)' "$ig/tags?fields=id&limit=1" -ExpectFail | Out-Null
Test-Endpoint 'account' 'mentioned_media (needs extra permission)' "$ig/mentioned_media?fields=id" -ExpectFail | Out-Null

# --- Account insights: every activity metric, yesterday and last 7 days ------------------------------------------
$activity = 'views', 'reach', 'accounts_engaged', 'total_interactions', 'likes', 'comments', 'saves', 'shares',
            'reposts', 'replies', 'profile_views', 'website_clicks', 'profile_links_taps', 'content_views'
foreach ($m in $activity) {
    Test-Endpoint 'insights:yesterday' $m "$ig/insights?metric=$m&period=day&metric_type=total_value&since=$d0&until=$d0" | Out-Null
}
Test-Endpoint 'insights:7d' 'all activity metrics' "$ig/insights?metric=$($activity -join ',')&period=day&metric_type=total_value&since=$w7&until=$d0" | Out-Null
Test-Endpoint 'insights:30d' 'views,reach,profile_views' "$ig/insights?metric=views,reach,profile_views&period=day&metric_type=total_value&since=$w30&until=$d0" | Out-Null

# --- Time series (only reach and follower_count accept it) -------------------------------------------------------
Test-Endpoint 'insights:time_series' 'reach 7d' "$ig/insights?metric=reach&period=day&since=$w7&until=$d0" | Out-Null
Test-Endpoint 'insights:time_series' 'reach 30d' "$ig/insights?metric=reach&period=day&since=$w30&until=$d0" | Out-Null
Test-Endpoint 'insights:time_series' 'follower_count 30d' "$ig/insights?metric=follower_count&period=day&since=$w30&until=$d0" | Out-Null
Test-Endpoint 'insights:time_series' 'views (rejected)' "$ig/insights?metric=views&period=day&since=$w7&until=$d0" -ExpectFail | Out-Null

# --- Breakdowns ---------------------------------------------------------------------------------------------------
foreach ($pair in @(
        @('reach', 'media_product_type'), @('reach', 'follow_type'), @('views', 'media_product_type'),
        @('views', 'follow_type'), @('total_interactions', 'media_product_type'), @('likes', 'media_product_type'),
        @('shares', 'media_product_type'), @('profile_links_taps', 'contact_button_type'),
        @('follows_and_unfollows', 'follow_type'))) {
    Test-Endpoint 'insights:breakdown' "$($pair[0]) by $($pair[1])" "$ig/insights?metric=$($pair[0])&period=day&metric_type=total_value&breakdown=$($pair[1])&since=$w7&until=$d0" | Out-Null
}

# --- Demographics (100+ followers) --------------------------------------------------------------------------------
foreach ($m in 'follower_demographics', 'engaged_audience_demographics', 'reached_audience_demographics') {
    foreach ($b in 'age', 'gender', 'country', 'city') {
        Test-Endpoint 'insights:demographics' "$m by $b" "$ig/insights?metric=$m&period=lifetime&metric_type=total_value&timeframe=this_month&breakdown=$b" | Out-Null
    }
}
Test-Endpoint 'insights:demographics' 'online_followers' "$ig/insights?metric=online_followers&period=lifetime" | Out-Null

# --- Removed metrics (should fail) ----------------------------------------------------------------------------------
foreach ($m in 'impressions', 'email_contacts', 'phone_call_clicks', 'text_message_clicks', 'get_directions_clicks') {
    Test-Endpoint 'insights:removed' $m "$ig/insights?metric=$m&period=day&metric_type=total_value" -ExpectFail | Out-Null
}

# --- One-day windows add up to the 7-day total? (decides how the daily sync must query) ----------------------------
$check = 'views', 'likes', 'profile_views'
$sum = @{}; foreach ($m in $check) { $sum[$m] = 0 }
for ($i = 6; $i -ge 0; $i--) {
    $day = Get-DayEnd $i
    $j = (Invoke-Graph "$ig/insights?metric=$($check -join ',')&period=day&metric_type=total_value&since=$day&until=$day").Body | ConvertFrom-Json
    foreach ($row in @($j.data)) { $sum[$row.name] += [int]$row.total_value.value }
}
$week = (Invoke-Graph "$ig/insights?metric=$($check -join ',')&period=day&metric_type=total_value&since=$w7&until=$d0").Body | ConvertFrom-Json
foreach ($row in @($week.data)) {
    $ok = $sum[$row.name] -eq [int]$row.total_value.value
    $results.Add([pscustomobject]@{ Group = 'consistency'; Check = "$($row.name): 7 single-day calls add up to the 7-day call"
        Status = $(if ($ok) { 'OK' } else { 'FAIL' }); Detail = "daily sum $($sum[$row.name]) vs 7-day $($row.total_value.value)" })
}

# --- Per-post insights (needs posts) --------------------------------------------------------------------------------
$feed = 'views,reach,likes,comments,shares,saved,reposts,total_interactions,follows,profile_visits'
$reel = 'views,reach,likes,comments,shares,saved,reposts,total_interactions,ig_reels_avg_watch_time,ig_reels_video_view_total_time,reels_skip_rate,crossposted_views,facebook_views'
$story = 'views,reach,shares,total_interactions,follows,profile_visits,replies'
$items = @(); if ($media) { $items += @($media.data) }
if ($items.Count -eq 0) {
    $results.Add([pscustomobject]@{ Group = 'media'; Check = 'per-post insights'; Status = 'EMPTY'; Detail = 'no posts on the account yet' })
}
foreach ($p in $items) {
    $label = "$($p.media_product_type)/$($p.media_type) $($p.id)"
    Test-Endpoint 'media' "$label fields" "$($p.id)?fields=id,caption,media_type,media_product_type,timestamp,permalink,like_count,comments_count,is_comment_enabled" | Out-Null
    $metrics = if ($p.media_product_type -eq 'REELS') { $reel } else { $feed }
    Test-Endpoint 'media' "$label insights" "$($p.id)/insights?metric=$metrics" | Out-Null
    if ($p.media_product_type -ne 'REELS') {
        Test-Endpoint 'media' "$label profile_activity" "$($p.id)/insights?metric=profile_activity&breakdown=action_type" | Out-Null
    }
    if ($p.media_type -eq 'CAROUSEL_ALBUM') {
        Test-Endpoint 'media' "$label children" "$($p.id)/children?fields=id,media_type" | Out-Null
    }
}

# --- Story insights (only while a Story is live) ---------------------------------------------------------------------
$live = @(); if ($stories) { $live += @($stories.data) }
if ($live.Count -eq 0) {
    $results.Add([pscustomobject]@{ Group = 'stories'; Check = 'story insights'; Status = 'EMPTY'; Detail = 'no live Story right now' })
}
foreach ($s in $live) {
    Test-Endpoint 'stories' "$($s.id) insights" "$($s.id)/insights?metric=$story" | Out-Null
    Test-Endpoint 'stories' "$($s.id) navigation" "$($s.id)/insights?metric=navigation&breakdown=story_navigation_action_type" | Out-Null
}

# --- Report --------------------------------------------------------------------------------------------------------------
$results | Format-Table -AutoSize -Wrap Group, Check, Status, Detail | Out-String -Width 220 | Write-Host
$results | Group-Object Status | Sort-Object Name | ForEach-Object { Write-Host ("{0,-9} {1}" -f $_.Name, $_.Count) }
if ($script:lastUsage) { Write-Host "`nRate-limit usage header: $($script:lastUsage)" }
Write-Host "Raw responses: $OutDir"
