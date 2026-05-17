---
layout: post
title: "Katie English - Apple & Jamf Device Security from the Silicon Up — Takeaways"
date: 2026-04-27 08:00:00 +0000
author: bigDoodR
description: "Key takeaways from Katie English's JNUC 2025 talk on Apple and Jamf device security, layered from the silicon all the way up to Jamf Protect."
image: https://img.youtube.com/vi/vo8M2V-98kI/hqdefault.jpg
categories: [tech, career]
---

My org isn't a Jamf customer. But I really appreciate that they film their annual Jamf Nation User Conference sessions and host them on YouTube for anyone to watch. So, once they've been posted, I start making the time to review what was presented and block off my calendar to go through topics that I think will be relevant for me/my org. One of those that immediately stuck out was Katie English's *Apple and Jamf Device Security from the Silicon Up*. And as I was watching it, I knew it was worth revisiting. If you've ever had to defend your Apple fleet's security posture to an infosec team armed with a spreadsheet, this one gives you the vocabulary and the framework to have that conversation confidently.

Here's the [YouTube recording](https://www.youtube.com/watch?v=vo8M2V-98kI); absolutely worth watching in full. But below is a condensed version -- the things that really stuck with me.

---

## The Framework: Security as Sedimentary Rock

Katie uses a geology metaphor — layers of sedimentary rock, stacked from the silicon at the bottom up through the OS, management, and beyond. Each layer adds more friction for a would-be attacker. I liked this framing a lot. It's not about any one tool being the answer; it's about how everything stacks together into something greater than its parts.

---

## Layer 1: The Secure Enclave

Everything starts here. Apple's system-on-chip includes a **Secure Enclave** — a dedicated subsystem that's physically separated from the main processor. It's a hardware-based key manager, and the separation matters: private keys never touch the application processor. Even if the kernel is compromised, the keys stay isolated.

It also has its own Boot ROM (immutable code written at manufacture), its own OS, and handles biometrics like Face ID and Touch ID so the main processor never sees your raw authentication data.

## Layer 2: Cryptographic Chain of Trust at Boot

Apple's boot process is a chain: Boot ROM → bootloader → kernel → Signed System Volume → OS. Each step verifies the next. The **Signed System Volume** seals Apple-installed software so only Apple-signed code runs at runtime. Software updates are subject to the same chain — Apple verifies the request, verifies the response, and prevents man-in-the-middle attacks and "replay" attacks (where an update is lifted from one device and delivered modified to another).

When you see headlines like "Apple stops signing iOS 18.x," that's this mechanism in action — breaking the cryptographic chain for old versions forces users onto newer, more secure ones.

## Layer 3: System Integrity Protection (SIP)

macOS-specific. On by default, hard to disable intentionally. Keeps critical system components in read-only mode. Check it anytime: `csrutil status`.

## Layer 4: Encryption

- **Mac (Intel):** FileVault
- **iPhone/iPad:** Data Protection
- **Apple Silicon Mac:** Data Protection → FileVault when enabled

All key management goes through the Secure Enclave. When you erase a device, the keys are destroyed, which is why modern erases are nearly instant. No more DOD 7-pass wipes.

## Layer 5: Runtime Security

This is where Gatekeeper, XProtect, notarization, sandboxing, BlastDoor, and Lockdown Mode live.

**Gatekeeper** quarantines downloaded apps and contacts Apple's notarization servers in real time when you try to open something new. The popup you see? That's an extended attribute applied by the system.

**Notarization** is the developer's side of this: submit your app to Apple, get a ticket, staple it to the package. Assures users the app is from a legitimate developer, is untampered with, and was intentionally released.

**XProtect** is the built-in anti-malware scanner. It uses signatures for known exploit patterns, updated whenever Apple finds something new in the wild.

**Sandboxing** means App Store apps can't reach data from other apps. Mobile apps in particular run with severely limited privileges — genuinely difficult (not impossible) to run malicious code on an iPhone.

**BlastDoor** (iOS) protects against zero-click attacks — the kind where you don't have to interact with a message for it to compromise your device. It analyzes untrusted incoming data before it can reach other parts of the system, and it continues checking dynamically even after the message arrives.

**Lockdown Mode** is the big hammer: opt-in, limits a lot of convenient features, dramatically shrinks the attack surface. For high-profile users or the genuinely paranoid.

**Late-breaking at time of presentation:** Apple shipped memory integrity enforcement with iPhone 17/Air — hardware + software that targets the most common iOS spyware vector (memory overruns) without degrading device performance. Worth keeping an eye on.

---

## The Jamf/MDM Layers

Once you've appreciated how much Apple builds in out of the box, the MDM's job is to surface and extend it.

### Enrollment
- **Supervised (via ABM/ASM):** Maximum control
- **Account-Driven User Enrollment (BYOD):** Strong user privacy, limited inventory — can't even see unmanaged OS data

If you've got employees using their work email for personal Apple IDs, now is a good time to work through ABM's domain capture process.

### Inventory & Reporting
You're reporting on FileVault status, allowed app locations, SIP status, and more — using MDM device info queries or declarative status updates.

### Managed Device Attestation
This is a gem. An MDM query that includes device properties attestation prompts Apple's servers to verify: does this hardware actually match known genuine Apple hardware and identifiers? You get a "success" back if it does. Prevents hardware spoofing, and you can use it in reporting or to issue certs via ACME.

### Declarative Device Management (DDM)
This is where things get interesting from a security standpoint. The key insight: **the most declared setting wins**, even over what a local admin would prefer.

- **Service Configuration:** Declare sshd off, sudo locked down, PAM configured — local admins can't touch it
- **Background Task Management:** Scripts, apps, and config files downloaded from a secure location, verified against a hash, stored in a tamper-proof local directory. Even local admins can't modify or delete them. This enables self-heal patterns (keeping the MDM binary alive, etc.)
- **Enforced Software Updates:** End users can't avoid them forever.

### Passwords & Platform SSO
Passwords are terrible. Platform SSO lets you use your cloud identity provider (IDP) to provision local accounts — before the device is even managed, as part of setup — and reduces local authentication events over time with MFA support. Fewer passwords touched = better outcomes.

### The Human Element (Layer 8)
Katie borrows "Layer 8" from the OSI model — the human. End users don't have to be a liability if you give them the right tools.

**Self Service+** — better notifications, security alerts, privilege elevation options — is a legitimate security layer, not just a nice-to-have.

**Compliance Benchmarks** is your easy button for applying a security baseline (NIST, CIS, etc.) without writing hundreds of lines of script.

---

## The Takeaway List

Katie's closing slide:

1. **Read the [Apple Platform Security Guide](https://support.apple.com/guide/security/welcome/web)**
2. **Manage to secure** — get devices in management and immediately leverage reporting + remediation
3. **Understand your risk** — old OS = known CVEs
5. **Use declarations via Blueprints** — lock down service config and background tasks
6. **Use Compliance Benchmarks** —  Check out the [MACE app repo](https://github.com/MACE-App/MACE) for getting things setup and deploying with your MDM
7. **Multiply XProtect with Jamf Protect** (or whichever endpoint protection solution available to your org/MDM)
8. **Self Service+** — your users are an asset
9. **Lockdown Mode + Executive Threat Protection** for high-risk users
10. **AI Assistant** for holistic risk visibility

---

*Talk by [Katie English](https://www.linkedin.com/in/katieenglish/), Jamf Product Team — JNUC 2025, Denver, CO.*  
*[Watch the full session on YouTube](https://www.youtube.com/watch?v=vo8M2V-98kI)*
