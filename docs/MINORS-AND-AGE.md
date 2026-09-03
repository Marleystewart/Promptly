# Minors, age, and what applies to Promptly

Researched 3 September 2026.

**Two caveats, stated up front because they change how you should use this.**
I am not a lawyer and none of this is legal advice. And this area moves faster
than almost any other in privacy law — my knowledge runs to May 2026, several
state statutes had compliance dates around then, and at least one major rule had
litigation pending. **Verify the current status of anything here before relying
on it**, and get a lawyer before signing a school contract.

What follows is the shape of the problem and the parts you can act on today.

## The finding you can act on

**Promptly stated no minimum age.** The privacy page already had a "Students
under 18" section covering the under-13 position — an earlier draft of this
document said there was no age language at all, which was wrong; the check that
produced it was truncated and I missed the section. What was genuinely missing
was a **minimum age**, and anything at all in the **Terms**.

Every consumer service states a minimum age, and its absence is the first thing
a school's counsel, an App Store reviewer, or a regulator will notice — before
any of the harder questions below.

**Resolved 3 September 2026.** Terms now carry a "Who can use Promptly" section,
and the minimum age plus the deletion route were folded into the privacy page's
existing "Students under 18" section rather than added alongside it — two
near-identical sections saying slightly different things is how a policy starts
contradicting itself. The remaining work here is legal review, not code.

## COPPA — low risk, not zero

COPPA governs online services in the US that are **directed to children under
13**, or that have **actual knowledge** they are collecting personal information
from someone under 13.

Promptly is not directed to under-13s by any reasonable reading. It is an
internship alert service; the signup collects school, graduation year and major;
the copy talks about summer internships and recruiting cycles. No part of it
appeals to children.

The residual risk is the "actual knowledge" limb. Promptly collects a
**graduation year**, which is a rough age proxy. If someone enters a graduation
year implying they are 12, the argument that you did not know becomes weaker.
Today nothing looks at that, and nothing needs to — but it is the reason a
stated minimum age matters more here than for a service that collects no age
signal at all.

**Practical position:** low risk. A minimum age in the Terms plus "we do not
knowingly collect from under-13s, tell us and we will delete it" is the
conventional answer, and Promptly already has a working deletion path to honour
the second half.

## The realistic case is high schoolers, not children

The likelier scenario by far is a 16- or 17-year-old signing up — a high school
senior looking at early-career programmes, or a rising freshman.

That is not COPPA. It falls under a patchwork of **state minor-protection laws**
that expanded considerably through 2024–2026, covering older minors and adding
duties around targeted advertising, data minimisation, and in some states
default privacy settings or age assurance. The details differ by state and
several were being litigated. **This is the part that most needs current legal
advice**, and the part I am least able to give you a reliable answer on.

Two things do carry over regardless of which statutes apply:

- **Promptly runs no advertising and does no behavioural targeting.** Most
  minor-specific obligations in these laws attach to targeted advertising and
  profiling for ads. Not doing it removes the sharpest edge.
- **The data minimisation work already done helps directly.** No résumé, no
  major or interests in the alert store, a graduation-year band rather than the
  exact year. Several of these statutes ask for exactly that.

## FERPA — does not apply to you *yet*

FERPA binds **schools** that receive US Department of Education funding. It does
not bind Promptly as a consumer service that students sign up for themselves.

It becomes relevant the moment a school shares student records with you, or
pays you to serve its students. Vendors typically operate under the "school
official" exception, which requires being under the school's direct control and
using the data only for the authorised purpose — a **contract** question, not a
code one.

Given school pilots are the growth strategy, this will come up. Keep the
existing rule: **no FERPA claims in any user-facing or sales copy without a
lawyer.** Saying "FERPA compliant" when the obligation is not even yours is a
misrepresentation that is easy to make and hard to walk back.

## App Store

Not a legal regime, but it gates the same question:

- An **age rating** is required at submission. Promptly's content is benign;
  the rating is straightforward.
- **Privacy nutrition labels** must accurately describe what you collect. These
  are now easy to fill in honestly — the audit doc and privacy page describe the
  real data flows, and the two stores genuinely differ as documented.
- The **Kids Category** is a trap to stay out of. Do not opt in. It brings a
  much stricter regime and Promptly has no reason to be there.

## What I would actually do

1. **State a minimum age.** Cheapest, most visible, closes the most common gap.
2. **Leave signup alone.** No age gate, no date of birth field. Collecting a
   birth date to check age means holding more personal data about minors, which
   is the opposite of the goal. Graduation year is already a sufficient proxy
   and you already collect it for a real product reason.
3. **Get a lawyer before the first school contract**, not before the first
   student. The consumer position is defensible; the school-vendor position is
   a contract you should not draft yourself.

## Wording — APPLIED 3 September 2026

Marley signed off; both sections are live and pinned by tests so a later copy
edit cannot quietly drop them. Recorded here as the text that shipped.

For Terms:

> **Who can use Promptly.** Promptly is intended for students aged 16 and over.
> If you are under 16, please do not create an account. We do not knowingly
> collect personal information from children under 13; if you believe a child
> under 13 has given us information, email help.promptly@gmail.com and we will
> delete it.

For Privacy — folded into the existing "Students under 18" section:

> Promptly is built for college students and is intended for students aged 16
> and over. It is not directed at children under 13, and we do not knowingly
> collect their information. If you believe a child under 13 has given us
> information, email help.promptly@gmail.com and we will delete it. You can
> delete your own account and data at any time from Profile → Settings →
> Delete My Data.

Sixteen is a judgement call, not a legal requirement — it is a common floor and
sits comfortably above the COPPA line while not excluding the high school
seniors who are a genuine part of the audience. Thirteen would also be
defensible. A lawyer should confirm which fits the states you care about.
