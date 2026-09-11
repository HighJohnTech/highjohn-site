# Security Policy

## Scope

This repository is maintained by High John Technology. Security reports should focus on vulnerabilities in code or configuration maintained in this repository.

## Reporting a vulnerability

Do **not** publish exploitable details, credentials, tokens, private data, or proof-of-concept attacks in a public issue.

If GitHub private vulnerability reporting is enabled for this repository, use that channel. Otherwise, contact High John Technology through the approved business contact published on `highjohn.tech` and request a private channel for the report before sharing sensitive technical details.

Please include, when safe to do so:
- affected file/component;
- impact;
- reproduction steps that do not expose real secrets or private data;
- suggested mitigation if known.

## Secret handling

Real API keys, passwords, private keys, access tokens, recovery codes, production credentials, and private customer/client data must not be committed to this repository.

If a secret is accidentally committed:
1. rotate/revoke it immediately;
2. remove it from active code/configuration;
3. assess whether Git history also requires cleanup;
4. review logs and downstream systems for misuse;
5. document the remediation without re-publishing the secret.

## Dependency and workflow security

- Keep GitHub Actions on supported versions.
- Use least-privilege `GITHUB_TOKEN` permissions.
- Do not execute untrusted fork code in privileged `pull_request_target` or similar workflows.
- Review dependency/security alerts before deployment.

## Status

This policy defines the reporting and repository-handling baseline. It does not claim that the site or its dependencies are free of vulnerabilities.