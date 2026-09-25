## Week 1 — First deployed slice

### Intended user outcome

- Submit synthetic feedback through the web app and retrieve it after a service restart.

### What shipped

- Next.js, NestJS, and PostgreSQL capture-and-list workflow on protected AWS EC2.
- TypeORM migration, synthetic seed, Docker Compose deployment, and SSH-tunnel access.

### Exit test

- Result and evidence: Submitted “EC2 deployment test Sep 24” through the tunnel; it remained after all containers restarted. CI passed for `450cede`.

### Engineering evidence

- Test or measurement: Deployed `curl -I` returned HTTP 200; browser save and reload succeeded; restart preserved data.
- Failure mode verified: Direct Mac connections to port 22 timed out. SSH on port 443 succeeded after its security-group rule and listener were configured.
- Architecture decision: Keep the web port bound to `127.0.0.1` and access it through an SSH tunnel until application authentication exists.
- Deployment and CI evidence: `docs/DEPLOYMENT.md`; [CI run](https://github.com/Dmitrii-Lobanov/signaldesk/actions/runs/36046133634).

### AI-assisted development evidence

- Task, acceptance criteria and context supplied: Protected Week 1 deployment with working browser → API → database flow and persistence after restart.
- Agent/model used and useful contribution: Codex helped sequence deployment and network diagnosis; [add your assessment].
- Mistake or unsupported assumption identified: Port 443 was tested once before its inbound security-group rule had been saved.
- My correction and verification evidence: Checked the inbound-rule table, saved the rule, and repeated the test; the instance saw the Mac connection.
- What I explained, modified or debugged without agent help: [Your account]
- Sanitized diff, test or example link: [Link or “None”]

### Scope and time

- Scope changed and why: Used AWS EC2 instead of the originally documented Oracle VM; [add your reason].
- Building and verification / targeted learning / independent practice / evidence hours: [Your four estimates]

### Reflection

- What I would do differently: [Your answer]
- Highest-risk assumption for next week: [Your answer]