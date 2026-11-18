---
title: Reducing AI vendor lock-in
description: Architecture trade-offs for a multi-provider AI coding workflow.
---

# Reducing AI vendor lock-in

> **Type:** architecture discussion. **Status:** a concept and design example, not a report of verified load tests.

## The problem

When a workflow depends entirely on one service, quotas, pricing changes, availability and API evolution become a team problem. This is **vendor lock-in**: dependence on a supplier.

## Context

This concerns development with AI agents, where the coding client and model can be separate. For example, OpenCode can be the client, with DeepSeek, Z.ai/GLM or Kimi providing models when suitable APIs and access terms permit it.

<span id="options"></span>

## Options and trade-offs

| Approach | Benefits | Trade-offs |
| --- | --- | --- |
| One provider and its CLI | Less configuration, integrated experience | Single point of failure, dependence on prices and policies |
| Independent client + multiple APIs | Model switching, cost and quality comparison | Differences in tool calling, context, caching and behavior |
| Self-hosted API gateway | Centralized configuration and control | Operations, latency, cost and a new point of failure |
| Local models | Infrastructure and data control | Hardware requirements, limits in quality and tool support |

<span id="a-pragmatic-starting-point"></span>

## A starting approach for an experiment

For a personal AI coding workflow, start by evaluating an **independent client and several compatible APIs**, without building a gateway prematurely. OpenCode is a candidate, not a universal best choice.

See the [OpenCode setup guide](/en/guides/opencode-setup) and [Claude Code CLI](/en/guides/claude-code-cli).

<span id="risks-and-limitations"></span>

## Risks

- **Compatibility:** a shared API protocol does not mean identical model capabilities or agent behavior.
- **Security:** the agent accesses the project, and the API provider receives submitted context. Review data policies.
- **Cost:** compare full request costs including output, context, caching and retries.
- **Terms:** network reachability does not establish permission to use a service in your region.
- **Operations:** test fallback on real tasks, not just a successful ping.

<span id="evaluation-checklist"></span>

## How to evaluate the solution

1. Choose a representative repository without secrets.
2. Repeat the same tasks on each model.
3. Measure cost, time, diff correctness and tool behavior.
4. Simulate the primary provider being unavailable.
5. Record CLI, OS, model versions and results.

**Until these checks are completed, there is no evidence that the system is fault tolerant.** Multiple configured providers do not provide automatic failover.

## Conclusion

Independence is the ability to **switch in a controlled way** without losing security or predictability, rather than the number of connected models. In architecture this is reducing vendor lock-in; in relationships, it might be called keeping your options open.
