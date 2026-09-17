# Pulse of Adelaide: publisher terms and release controls

Source: user's accepted *South Australian Government Fuel Pricing Information Scheme Data Publisher Terms and Conditions*, v1 February 2021 (two-page PDF), checked 2026-09-16. API guide: *SAFPIS API (OUT) Definition*, v1.2 February 2021. This is an implementation checklist, not legal advice or evidence that the live account/site is configured. The written agreement and any later notices take precedence.

| Clause | Practical interpretation and implementation | Before a public release |
| --- | --- | --- |
| 1.1–1.11 | Defines Data as **current** fuel data and defines active, new and returning users for reporting. | Do not describe this static snapshot as a historic dataset or a direct real-time feed. |
| 2.1–2.4 | Conditional, non-exclusive publication right; free access for retail consumers. $1.10 GST inclusive is payable **if demanded by the State**, not charged to visitors. | Keep price viewing free. Do not place the map or data behind a paywall. |
| 2.5–2.6 | The State can terminate for breach and may notify changed conditions. | Record notice recipient; on each notice assess and update the site. Remove public copies promptly on termination. |
| 3.1 | Exact required credit on **any copy**, however reformatted or redisplayed. | Visible source line beneath map; same string in exported snapshot and metadata; manually add it to future charts/screenshots, downloadable extracts and shared price graphics. The PDF's odd punctuation is reproduced literally instead of silently changing the contractual text. |
| 3.2 | Clearly distinguish State data from other sources. | State prices labelled separately from OpenStreetMap background and our own median/colour calculations. Do not ascribe derived values to the State. |
| 3.3 | Users must be able to complain **immediately to the State** if prices are not current. | Persistent direct `mailto:FuelPricingScheme@sa.gov.au` link beside the map, plus the official motorist reporting page and a `tel:131882` fallback; retain them in no-data/error states. Verify them on intended devices; mailto may need a configured mail client. |
| 3.4 | No further dissemination after termination. | Stop refreshes; remove local files with `--retire`, remove origin files, redeploy, purge caches and verify both public JSON URLs no longer work. The static asset URL is itself redistribution. |
| 3.5 | No implied State approval/association and no government logos, trademarks, acronyms or designs without written permission. | Simple independent-portfolio wording only. The legally required agency name in the attribution is not a claim of endorsement. No state logo, badge or government-branded card. |
| 3.6–3.7 | Usage reports on request **within 10 business days**: SA monthly 30-day active users, active by region, new SA/month and region, returning SA/month and region. | **Not yet met:** no suitable production audience analytics is configured in the supplied repo. Set up and verify privacy-conscious analytics with monthly location/new/returning/active reporting, permitted access and export before publishing; retain the reports and a request-response process. Never assert this can be inferred from raw static page views. |
| 4.1–4.2 | Cooperate with reasonable audit and remedy instructions. | Retain source version, process notes, release timestamps, validation logs, correspondence and usage-report exports securely; never expose the subscriber token in an audit-ready public repository. |
| 5.1–5.3 | The State excludes or limits warranties/liability and the publisher accepts risks and indemnity subject to the stated exception. | Present prices as reports at a stated retrieval time, not verified bowser prices. Publisher should understand the contractual risk; client UI copy cannot waive it. |
| 6–8 | No assignment without State consent; waiver and South Australian governing law provisions. | Keep the publisher account under the accepted entity; do not transfer credentials/agreement. No website banner needed. |
| 9–10 | Notices by the specified address, agreement changes only as stated. | Monitor account email and `FuelPricingScheme@sa.gov.au` correspondence; store a private copy of the accepted PDF and later signed amendments. |

## Operational limits from the separate API guide

- Guide pp. 4–6: HTTPS and private `FPDAPI SubscriberToken=...` header **server to server**, never per visitor or in client JS. A credential being issued is not proof it has activated.
- Guide pp. 9–13: fuel/region/site details should be cached for one day. Adelaide region is resolved from the catalogue; site coordinates come from the source, not inferred.
- Guide pp. 15–16: price requests no more frequently than once a minute; value `9999` means unavailable; prices are tenths of a cent; price transaction times are UTC.
- Retained raw files and generated output are ignored by Git, but `public/` exports enter Astro builds even when ignored. Schedule/deployment monitoring and audience reporting remain separate work. Check any later publisher notices before enabling publication.

## Current release decision

The supplied agreement supports free publication with its conditions; the earlier note that redistribution terms were unknown is superseded. The code now supplies attribution, direct State contact, source separation, a freshness cutoff and a termination helper. **Production is not enabled or confirmed compliant yet:** actual authenticated access, live response quality, deployment/update cadence, audience reports and public-link validation are unverified. Do not promote local data to the public site until the operational tasks above have been completed. No changes were made to the provider's account or hosting.
