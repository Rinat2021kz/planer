export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API endpoint для получения текущей версии приложения
    if (url.pathname === "/api/version") {
      try {
        const result = await env.DB.prepare(
          "SELECT version, build_number, release_date, description FROM app_version WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1"
        ).first();

        if (!result) {
          return Response.json({ error: "Version not found" }, { status: 404 });
        }

        return Response.json({
          version: result.version,
          buildNumber: result.build_number,
          releaseDate: result.release_date,
          description: result.description,
        });
      } catch (error) {
        return Response.json(
          { error: "Database error", message: error instanceof Error ? error.message : String(error) },
          { status: 500 }
        );
      }
    }

    // API endpoint для получения всех версий
    if (url.pathname === "/api/versions") {
      try {
        const { results } = await env.DB.prepare(
          "SELECT id, version, build_number, release_date, description, is_active, created_at FROM app_version ORDER BY created_at DESC"
        ).all();

        return Response.json({
          versions: results.map((row: any) => ({
            id: row.id,
            version: row.version,
            buildNumber: row.build_number,
            releaseDate: row.release_date,
            description: row.description,
            isActive: row.is_active === 1,
            createdAt: row.created_at,
          })),
        });
      } catch (error) {
        return Response.json(
          { error: "Database error", message: error instanceof Error ? error.message : String(error) },
          { status: 500 }
        );
      }
    }

    // Старый тестовый endpoint
    if (url.pathname.startsWith("/api/")) {
      return Response.json({
        name: "Cloudflare",
      });
    }

		return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
