# Project Release Checklist

Use this checklist only after the user has finished local review iterations and asked for a release candidate. Passing it does not authorise publication; commit and push still require explicit approval.

## Collaborative gate

- [ ] Brief and direction were reviewed
- [ ] Source and data feasibility were reviewed
- [ ] Local prototype was reviewed
- [ ] Requested iteration rounds are complete
- [ ] User explicitly asked for a release candidate
- [ ] Usage was checked at substantial stage boundaries when available

## Content

- [ ] Project title is clear
- [ ] Question is stated plainly
- [ ] Summary works as a card description
- [ ] Main findings are supported by the data
- [ ] Data source is linked
- [ ] Method is documented
- [ ] Important limitations are stated
- [ ] Published or updated date is correct

## Visual

- [ ] Main visual loads correctly
- [ ] Loading state is acceptable
- [ ] Empty or missing-data states are handled
- [ ] Legends are understandable
- [ ] Labels are readable
- [ ] Visual does not rely only on colour for critical meaning

## Interaction

- [ ] Mouse interaction works
- [ ] Touch interaction works
- [ ] Keyboard access works for controls
- [ ] Hover-only information has a tap or focus alternative
- [ ] Play and pause exist for meaningful autoplay animation
- [ ] Reduced-motion behaviour works

## Responsive

- [ ] Checked around 360 px width
- [ ] Checked around 390 to 430 px width
- [ ] Checked around 768 px width
- [ ] Checked around 1280 px width
- [ ] Checked around 1600 px width

## Performance

- [ ] Unused large data is not shipped to the browser
- [ ] Project-only libraries are not loaded site-wide
- [ ] Large images are compressed
- [ ] Animation remains usable on a typical phone

## Build

- [ ] [Data release checklist](data-release.md) completed for new or materially changed datasets, including LAB prototypes

- [ ] `npm run build` succeeds
- [ ] Main project URL loads locally
- [ ] DATA, MAPS, GAMES, or LAB listing shows the project correctly
- [ ] Homepage feature state is correct

## Release

- [ ] User explicitly approved this release candidate for publication
- [ ] Git diff reviewed
- [ ] Documentation updated
- [ ] Commit message is specific
- [ ] Existing Cloudflare Worker deployment succeeds when release is authorised (see [deployment workflow](../deployment-workflow.md))
- [ ] Production URL tested on desktop
- [ ] Production URL tested on phone
