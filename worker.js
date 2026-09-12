function getVisitorId(request) {
    const cookie = request.headers.get("Cookie") || "";
    const match = cookie.match(/(?:^|;\s*)visitor_id=([^;]+)/);

    if (match && match[1]) {
        return match[1];
    }

    return crypto.randomUUID();
}

function createCookie(visitorId) {
    return `visitor_id=${visitorId}; Path=/; Max-Age=31536000; Secure; HttpOnly; SameSite=Lax`;
}

function jsonResponse(data, status = 200, visitorId = null) {
    const headers = {
        "Content-Type": "application/json; charset=UTF-8"
    };

    if (visitorId) {
        headers["Set-Cookie"] = createCookie(visitorId);
    }

    return new Response(JSON.stringify(data), {
        status,
        headers
    });
}

export default {
    async fetch(request, env) {

        const url = new URL(request.url);

        /*
        ==========================================
        GET /
        给访客分配 visitor_id
        ==========================================
        */

        if (request.method === "GET" && url.pathname === "/") {

            const visitorId = getVisitorId(request);

            return env.ASSETS.fetch(
                new Request(request, {
                    headers: request.headers
                })
            ).then(response => {

                const newHeaders = new Headers(response.headers);

                newHeaders.set(
                    "Set-Cookie",
                    createCookie(visitorId)
                );

                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: newHeaders
                });
            });
        }


        /*
        ==========================================
        POST /api/profile
        保存用户资料
        ==========================================
        */

        if (
            request.method === "POST" &&
            url.pathname === "/api/profile"
        ) {

            try {

                const data = await request.json();

                const name = String(data.name || "").trim();

                const age = Number(data.age);

                const city = String(data.city || "").trim();

                const interests =
                    String(data.interests || "").trim();

                const about =
                    String(data.about || "").trim();

                const ageRange =
                    String(data.ageRange || "").trim();

                const personality =
                    Array.isArray(data.personality)
                        ? data.personality.join(", ")
                        : String(data.personality || "").trim();

                const relationshipGoal =
                    String(data.relationshipGoal || "").trim();

                const activities =
                    Array.isArray(data.activities)
                        ? data.activities.join(", ")
                        : String(data.activities || "").trim();


                /*
                ==========================================
                获取 visitor_id
                ==========================================
                */

                const visitorId = getVisitorId(request);


                /*
                ==========================================
                获取真实公网 IP
                Cloudflare 提供
                ==========================================
                */

                const ip =
                    request.headers.get("CF-Connecting-IP") ||
                    "unknown";


                /*
                ==========================================
                基础验证
                ==========================================
                */

                if (!name) {
                    return jsonResponse({
                        success: false,
                        error: "Name is required."
                    }, 400, visitorId);
                }

                if (
                    !Number.isInteger(age) ||
                    age < 18 ||
                    age > 100
                ) {
                    return jsonResponse({
                        success: false,
                        error: "Invalid age."
                    }, 400, visitorId);
                }

                if (!city) {
                    return jsonResponse({
                        success: false,
                        error: "City is required."
                    }, 400, visitorId);
                }


                /*
                ==========================================
                检查这个浏览器是否已经提交过
                ==========================================
                */

                const existing =
                    await env.DB.prepare(
                        `
                        SELECT id
                        FROM profiles
                        WHERE visitor_id = ?
                        LIMIT 1
                        `
                    )
                    .bind(visitorId)
                    .first();


                if (existing) {

                    return jsonResponse({
                        success: false,
                        error: "Profile already submitted.",
                        alreadySubmitted: true
                    }, 409, visitorId);

                }


                /*
                ==========================================
                保存到 D1
                ==========================================
                */

                await env.DB.prepare(
                    `
                    INSERT INTO profiles
                    (
                        name,
                        age,
                        city,
                        interests,
                        about,
                        age_range,
                        personality,
                        relationship_goal,
                        activities,
                        ip_address,
                        visitor_id
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `
                )
                .bind(
                    name,
                    age,
                    city,
                    interests,
                    about,
                    ageRange,
                    personality,
                    relationshipGoal,
                    activities,
                    ip,
                    visitorId
                )
                .run();


                /*
                ==========================================
                成功
                ==========================================
                */

                return jsonResponse({
                    success: true,
                    message: "Profile saved successfully."
                }, 200, visitorId);


            } catch (error) {

                console.error(error);

                return jsonResponse({
                    success: false,
                    error: "Server error."
                }, 500);
            }
        }


        /*
        ==========================================
        其他请求交给静态网站
        ==========================================
        */

        return env.ASSETS.fetch(request);
    }
};
