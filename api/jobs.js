export default async function handler(req, res) {
  const query = (req.query.q || "").toLowerCase();

  try {
    const [arbeitnowRes, remotiveRes] = await Promise.allSettled([
      fetch("https://www.arbeitnow.com/api/job-board-api"),
      fetch(`https://remotive.com/api/remote-jobs${query ? `?search=${encodeURIComponent(query)}` : ""}`),
    ]);

    let jobs = [];

    if (arbeitnowRes.status === "fulfilled" && arbeitnowRes.value.ok) {
      const data = await arbeitnowRes.value.json();
      const normalized = (data.data || []).map((j) => ({
        title: j.title,
        company: j.company_name,
        location: j.location || (j.remote ? "Remote" : ""),
        url: j.url,
        tags: j.tags || [],
        source: "Arbeitnow",
        publishedAt: j.created_at ? new Date(j.created_at * 1000).toISOString() : null,
      }));
      jobs = jobs.concat(normalized);
    }

    if (remotiveRes.status === "fulfilled" && remotiveRes.value.ok) {
      const data = await remotiveRes.value.json();
      const normalized = (data.jobs || []).map((j) => ({
        title: j.title,
        company: j.company_name,
        location: j.candidate_required_location || "Remote",
        url: j.url,
        tags: j.tags || [],
        source: "Remotive",
        publishedAt: j.publication_date || null,
      }));
      jobs = jobs.concat(normalized);
    }

    if (query) {
      jobs = jobs.filter(
        (j) =>
          j.title?.toLowerCase().includes(query) ||
          j.company?.toLowerCase().includes(query) ||
          j.tags?.some((t) => t.toLowerCase().includes(query))
      );
    }

    jobs.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
    jobs = jobs.slice(0, 40);

    return res.status(200).json({ jobs });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to fetch jobs" });
  }
}
