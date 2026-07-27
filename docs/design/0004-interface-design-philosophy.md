# 0004: Interface design philosophy

| Field        | Value       |
| ------------ | ----------- |
| Status       | Development |
| Scope        | Experience  |
| Created      | 2026-07-27  |
| Last updated | 2026-07-27  |

## Summary

Hyperkernel's interface will prioritize useful capability for daily work while
remaining intuitive, comfortable, and visually restrained. Content and the
user's current task take precedence over interface chrome. Essential controls
remain easy to find and operate, while advanced or infrequent controls may use
predictable secondary or contextual surfaces.

Motion communicates state, causality, spatial relationships, or events rather
than decorating the interface. Layouts adapt across supported screen sizes and
input methods without losing essential capability, and accessibility is a
baseline requirement.

Developers will be able to create themes and may allow users to choose among
them. Customization will favor coherent, interface-wide choices such as font
family, text scale, and color instead of unrestricted per-component styling.

This record defines target Experience-layer goals. It does not claim that every
goal, customization contract, or advanced interaction is implemented today.

## Problem

Productivity interfaces are used repeatedly and often for long periods. They
must provide the capabilities required to complete real work, communicate
system state clearly, and remain comfortable after the novelty of the
interface has disappeared.

Capability and simplicity can pull in opposite directions. Showing every
control at once can overwhelm the content and make common work slower. Hiding
too much can produce an interface that appears minimal but is difficult to
learn, operate, or trust.

The same interface must also adapt to different screen sizes, input methods,
access needs, applications, and themes without becoming a collection of
unrelated designs. Hyperkernel needs a durable philosophy for deciding what is
prominent, what may be disclosed later, what motion is justified, and where
customization must stop.

## Invariants

1. Visual minimalism must never remove the capabilities required to complete a
   supported workflow.
2. Content and the user's current task are the primary visual focus. Every
   persistent interface element must justify the attention and space it uses.
3. Essential controls must be easy to discover, understand, and target with
   the input methods supported in their context.
4. Secondary or contextual placement must remain predictable and discoverable.
   It must not become a way to hide an essential action or the only path to
   recovery.
5. The interface must communicate consequential state, including pending work,
   success, rejection, failure, permissions, and unavailable capability.
6. Motion must communicate information. It must not be required to understand
   the interface, block work unnecessarily, or disregard reduced-motion
   preferences.
7. A supported screen size or input method must retain every essential
   capability, even when its layout or disclosure mechanism changes.
8. Semantic structure, focus behavior, keyboard fundamentals, contrast,
   readable scaling, and assistive-technology support are baseline
   requirements.
9. Advanced keyboard efficiency is a long-term goal. Current implementation
   choices must preserve native keyboard behavior and must not create avoidable
   barriers to that goal.
10. Themes may change approved global presentation values, but they must not
    weaken usability, accessibility, interaction semantics, or the hierarchy
    of essential controls.
11. Interface convenience never bypasses Hyperkernel's command, capability,
    persistence, or audit boundaries.

## Decision

### Put usefulness before visual minimalism

The first measure of a Hyperkernel interface is whether people can use it to do
their work. A visually elegant surface that omits a necessary capability is not
successful.

Minimalism governs presentation rather than product scope. Hyperkernel will
reduce redundant chrome, decoration, competing emphasis, and controls that are
irrelevant to the current task. It will not reduce a complete workflow to
protect an aesthetic.

Comfort matters alongside efficiency. Typography, spacing, contrast, density,
and interaction feedback should support sustained daily use rather than only a
strong first impression.

### Keep content primary and essential controls targetable

Hierarchy begins with the content being read, created, inspected, or changed.
Controls should have only as much visual prominence as their importance,
frequency, urgency, and risk require.

Frequent and essential controls must have clear affordances and practical
targets across pointer, touch, and keyboard contexts. A control may be visually
compact without making its usable target unnecessarily small. The interface
must not rely on precision pointing when the device or context cannot provide
it.

Minimal does not mean empty, monochrome, or unlabeled. Labels, boundaries,
status, and explanatory text remain when they materially improve orientation,
confidence, or task completion.

### Reveal complexity progressively and predictably

Advanced, infrequent, or context-specific controls may move to secondary
surfaces such as menus, inspectors, disclosures, or contextual toolbars. Their
placement should reduce distraction from the common path while keeping the
full capability available.

Every secondary capability needs a predictable discovery path. Context-aware
controls must appear for a reason the user can understand and remain reachable
without requiring hidden pointer gestures. Frequency alone does not decide
placement: rare but urgent, high-risk, or recovery-related actions may require
greater prominence.

### Communicate state and consequences

The interface must make cause and effect legible. It should distinguish an
available action from an unavailable one, a submitted command from a committed
result, and pending work from success, rejection, or failure.

Consequential operations require clarity appropriate to their risk. Interface
restraint must not obscure permissions, destructive consequences, recoverable
errors, or the audit information people need to trust the system.

### Use motion as communication

Animation is justified when it explains:

- the relationship between an action and its result;
- a change of state or location;
- the appearance, removal, or reorganization of content;
- progress, interruption, or another system event.

Animation is not added merely to make an interface feel more engaging. Motion
should be brief, interruptible where appropriate, and secondary to direct
feedback. The same information must remain understandable when nonessential
motion is reduced or removed.

Visual style remains important, but motion is part of the interaction language,
not surface decoration.

### Adapt the interface instead of shrinking it

Hyperkernel interfaces will adapt across the full range of screen sizes they
support. Responsive design may change layout, density, navigation, grouping,
and disclosure patterns rather than compressing a desktop arrangement until it
fits.

Essential capability must remain available at each supported size. Components
should respond to the space available to them, which is especially important
in a multitasking workspace where an application may occupy only part of a
large screen.

The supported device, viewport, browser, and input matrix will be documented
and verified separately as the product matures. Until then, this principle is a
goal rather than a claim of universal device support.

### Build accessibility into the baseline

Accessibility is part of interface correctness. Hyperkernel will prefer
semantic elements and native behavior, preserve understandable focus order and
visible focus, support readable text scaling and sufficient contrast, and
avoid using color or motion as the only carrier of meaning.

Pointer, touch, keyboard, and assistive-technology needs must be considered
when an interaction is designed, not added only after its visual form is
complete. Exact conformance targets and verification procedures require a
separate supported-accessibility contract.

### Preserve keyboard fundamentals while growing advanced support

Comprehensive keyboard efficiency, including consistent shortcuts and
command-oriented navigation, is a long-term goal. Early versions may not offer
the complete system.

Baseline keyboard operation is not deferred. Native controls, logical tab
order, visible focus, and expected activation and dismissal behavior should be
preserved from the beginning. When keyboard support can be gained through a
standard platform element without materially increasing complexity,
Hyperkernel should take that path.

New interactions must avoid unnecessary behavior that would later require
rewriting the interface to add advanced keyboard support.

### Customize through coherent themes

Developers will be able to create Hyperkernel themes. The developer responsible
for an interface or distribution will decide whether users may select among its
installed themes. The future theme contract should expose stable, global
choices that produce coherent results throughout the interface.

Expected customization areas include font family, text scale, and color. The
exact token names, validation rules, packaging format, compatibility policy,
and runtime API are not defined by this record.

Hyperkernel will not make every detail of every component independently
customizable. Layout hierarchy, interaction semantics, focus treatment,
targetability, and other product-level constraints remain owned by the
interface system. These constraints preserve coherence, accessibility, and a
recognizable product while still allowing themes to express meaningful
differences.

Global choices are preferred because they give users understandable control and
give theme authors a bounded contract. More customization may be added when it
can preserve those properties, but unrestricted customization is not a goal.

### Learn from references without copying them

Hyperkernel will take design inspiration from Apple, Figma, Linear, and Vercel.
They are reference points for qualities such as restraint, clarity, precise
tools, strong hierarchy, and responsive interaction.

These products are not templates or compatibility targets. Hyperkernel must
develop an interface language appropriate to its own multitasking model, trust
boundaries, applications, and users.

## Considered solutions

### Keep all capabilities visible

An always-visible, capability-dense interface can make advanced tools quick to
reach and easier to enumerate.

This solution is rejected as the general model because it gives infrequent
controls persistent visual weight, competes with content, and makes the common
path harder to understand. Specific workspaces may still justify higher density
when the task requires it.

### Pursue radical visual minimalism

A very sparse interface can create a strong first impression and reduce the
number of immediate decisions.

This solution is rejected because hiding or removing necessary capability makes
daily work less effective. Restraint is useful only when the full workflow
remains discoverable and operable.

### Use decorative animation to increase engagement

Decorative motion can give an interface a distinctive personality and attract
attention.

This solution is rejected because daily productivity software should protect
attention. Motion is reserved for communication, while personality should come
primarily from typography, color, composition, language, and carefully chosen
static details.

### Allow unrestricted per-component customization

Exposing every visual property would maximize theoretical flexibility.

This solution is rejected because it would make themes difficult to author and
validate, weaken product coherence, create accessibility risks, and expand the
compatibility surface for every component.

### Provide no customization

A single fixed visual system would be easier to implement and test.

This solution is rejected because developers and users benefit from meaningful
control over global presentation, including type, scale, and color. A
constrained theme contract provides that control without surrendering the
interface's product-level invariants.

## Consequences

### Gains

- Daily work and complete workflows remain the primary design measure.
- Content receives more attention than persistent interface chrome.
- Advanced capability can remain available without competing with common work.
- Motion has a consistent purpose and respects user preferences.
- Responsive and accessible behavior are considered part of correctness.
- A bounded theme system can support meaningful variation while preserving a
  coherent product.
- The philosophy gives application and component decisions a shared basis
  without prescribing one visual treatment for every context.

### Costs and limitations

- Progressive disclosure requires careful information architecture and
  usability testing; a secondary surface can easily become an undiscoverable
  one.
- Responsive behavior must be designed and verified across multiple layout and
  input conditions.
- Accessibility and theme validation add ongoing design, implementation, and
  testing work.
- Context-aware interfaces require more judgment than a fixed rule based only
  on control frequency.
- Product-owned constraints intentionally limit what theme authors can change.
- Advanced keyboard workflows will remain incomplete until the project can
  define and implement a consistent system.
- This record does not define component specifications, a theme API, exact
  target sizes, a supported-device matrix, a shortcut model, or a formal
  accessibility conformance target.

## Evaluation

This record may advance to Evaluation when:

- a representative daily workflow exposes every required capability while
  keeping its common path focused;
- essential and secondary controls are discoverable and operable across the
  supported pointer, touch, and keyboard contexts;
- representative layouts adapt to narrow, wide, and multitasking container
  sizes without losing essential capability;
- interface state, command outcomes, failures, permissions, and recovery paths
  remain legible;
- repeated-use evaluation confirms that typography, contrast, density, and
  interaction feedback remain comfortable during sustained work;
- reduced-motion behavior preserves meaning and task completion;
- representative themes vary font family, text scale, and color without
  breaking hierarchy, targetability, layout, or accessibility;
- complex interactions have documented semantic, focus, keyboard, and
  assistive-technology expectations.

It may advance to Stable after the philosophy has guided multiple representative
applications and themes, the supported device and accessibility contracts are
defined, and user evaluation confirms that progressive disclosure preserves
both focus and discoverability.

## References

- [Hyperkernel public architecture](../../README.md)
- [Hyperkernel engineering contracts](../../AGENTS.md)
- [0003: Web-platform-first frontend](0003-web-platform-first-frontend.md)

## Status history

| Date       | Status      | Reason                                                      |
| ---------- | ----------- | ----------------------------------------------------------- |
| 2026-07-27 | Development | Interface direction chosen; implementation remains partial. |
