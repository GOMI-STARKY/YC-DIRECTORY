#!/usr/bin/env node
// Simple check to verify SANITY_WRITE_TOKEN can read data from the dataset
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_WRITE_TOKEN;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-10-14';

if (!projectId || !dataset) {
  console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_DATASET in env');
  process.exit(2);
}

const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=*[_type==\"startup\"]|order(_createdAt desc)[0...1]`;

(async () => {
  try {
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      console.error('Sanity responded with status', res.status, await res.text());
      process.exit(1);
    }
    const json = await res.json();
    console.log('Sanity query succeeded. Examples:', JSON.stringify(json.result || json.data || json, null, 2));
  } catch (err) {
    console.error('Failed to query Sanity:', err);
    process.exit(1);
  }
})();
