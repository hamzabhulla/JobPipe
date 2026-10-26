import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf-8");
}

function titleOf(html: string): string {
  const m = html.match(/<title>([^<]+)<\/title>/);
  return m?.[1] ?? "";
}

function descriptionOf(html: string): string {
  const m = html.match(
    /<meta name="description" content="([^"]+)" \/>/,
  );
  return m?.[1] ?? "";
}

function jsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const re =
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    blocks.push(JSON.parse(m[1] ?? ""));
  }
  return blocks;
}

describe("sitemap", () => {
  it("lists only existing static pages", () => {
    const xml = read("public/sitemap.xml");
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (m) => m[1] ?? "",
    );
    expect(locs.length).toBeGreaterThan(0);
    expect(locs).not.toContain("https://jobpipe.vercel.app/app");
    for (const loc of locs) {
      const url = new URL(loc);
      const file =
        url.pathname === "/"
          ? "index.html"
          : `${url.pathname.slice(1)}/index.html`;
      expect(existsSync(join(root, file)), `${loc} -> ${file}`).toBe(true);
      expect(url.protocol).toBe("https:");
    }
  });

  it("has ISO 8601 lastmod dates", () => {
    const xml = read("public/sitemap.xml");
    const mods = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(
      (m) => m[1] ?? "",
    );
    expect(mods.length).toBeGreaterThan(0);
    for (const mod of mods) {
      expect(mod).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe("robots.txt", () => {
  it("references the absolute sitemap URL", () => {
    const robots = read("public/robots.txt");
    expect(robots).toContain(
      "Sitemap: https://jobpipe.vercel.app/sitemap.xml",
    );
  });
});

describe("landing page SEO", () => {
  const html = read("index.html");

  it("has a title under 60 chars and a description under 160 chars", () => {
    expect(titleOf(html).length).toBeGreaterThan(0);
    expect(titleOf(html).length).toBeLessThan(60);
    expect(descriptionOf(html).length).toBeGreaterThan(0);
    expect(descriptionOf(html).length).toBeLessThan(160);
  });

  it("has exactly one H1", () => {
    const h1s = html.match(/<h1>/g) ?? [];
    expect(h1s).toHaveLength(1);
  });

  it("has valid JSON-LD, and FAQPage matches the visible FAQ exactly", () => {
    const blocks = jsonLdBlocks(html);
    expect(blocks.length).toBeGreaterThan(0);
    const graph = (blocks[0] as { "@graph": unknown[] })["@graph"];
    const faq = graph.find(
      (n) => (n as { "@type": string })["@type"] === "FAQPage",
    ) as {
      mainEntity: { name: string; acceptedAnswer: { text: string } }[];
    };
    expect(faq.mainEntity.length).toBe(7);
    const visibleQuestions = [
      ...html.matchAll(/<summary>([^<]+)<\/summary>/g),
    ].map((m) => m[1] ?? "");
    expect(visibleQuestions).toEqual(
      faq.mainEntity.map((q) => q.name),
    );
    // Every FAQ answer must also appear verbatim in the visible page.
    for (const q of faq.mainEntity) {
      expect(html).toContain(q.acceptedAnswer.text);
    }
  });

  it("sub-pages have unique titles and descriptions within limits", () => {
    for (const rel of [
      "privacy/index.html",
      "about/index.html",
      "changelog/index.html",
    ]) {
      const page = read(rel);
      const title = titleOf(page);
      const desc = descriptionOf(page);
      expect(title.length).toBeGreaterThan(0);
      expect(title.length).toBeLessThan(60);
      expect(desc.length).toBeGreaterThan(0);
      expect(desc.length).toBeLessThan(160);
      expect(title).not.toBe(titleOf(html));
    }
  });
});
