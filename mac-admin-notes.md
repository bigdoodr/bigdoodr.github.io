---
layout: page
title: "Mac Admin Session Notes"
description: "Cheat-sheet notes from PSUMac and other Mac admin sessions."
date: 2026-05-18
permalink: /mac-admin-notes/
---

Cheat-sheet notes and references from past Mac admin sessions. Speaker credit and session links included where available.

---

## PSUMac 2024

### Basic Git for Non-Programmers

*Chris Carr ([@carrchr@hachyderm.io](https://hachyderm.io/@carrchr)) — [Community Notes](https://docs.google.com/document/d/17ohILFaj47Sxoj-Y1TnIAXgVNY8y_acqDac1VXoDzYs/edit)*

#### Why Git?
- Track changes to files (the ultimate undo)
- Share and collaborate on code or documentation
- Your users/developers are already using it
- Systems use it for deployment

#### Key Terminology
- **Working Tree** — the files and folders git is managing
- **Repository (repo)** — directory at the top level of a working tree
- **Commit** — a snapshot; both a noun and a verb
- **Branch** — a name/pointer to a commit (e.g., `main`, `develop`, `my-bugfix`)
- **Remote** — another machine running/hosting git (GitHub, GitLab, etc.)
- **Hash** — unique string identifying a specific commit
- **Tag** — a long-lasting label attached to a specific commit
- **Diff** — the difference between versions of files
- **Stash** — temporary storage for uncommitted changes

#### Getting Started
```bash
git init          # create a new repo in the current directory
git clone <url>   # copy an existing repo locally
git add .         # stage all files recursively
```

#### .gitignore
- Most projects should have one — hidden file at the repo root
- Tells git what NOT to track
- Templates: [github.com/github/gitignore](https://github.com/github/gitignore)

#### Committing
```bash
git diff <file>        # see unstaged changes
git commit --amend     # rewrite the previous commit (safe if not yet pushed)
git fetch              # good habit before committing — see if remote has new changes
```

> "If it's only you, 'future you' is your collaborator. Ask: what would I want to remember about this change?"

#### Branches
Cheap and free — make as many as you want. `main` = production/release; `develop` = active work. Branches let you experiment without touching "the good code."

```bash
git branch --all               # list all branches
git checkout <branch>          # switch to an existing branch
git checkout -b <new-branch>   # create and switch to a new branch
git fetch                      # update available branch list from remote
```

#### Remotes
Automatically named `origin` when you `git clone`. If you `git init` a new repo, add the remote yourself:

```bash
git remote add origin <url>
```

#### Syncing
```bash
git fetch                     # update local knowledge of remote (does NOT merge)
git pull                      # shortcut: fetch + merge (use -r for rebase instead)
git push                      # send current branch and commits to remote
git push --force-with-lease   # force push, but stops if it would overwrite others' work
```

#### Reset and Recovery
```bash
git reset --hard    # nuke all changes, return to previous commit state
git reset --soft    # go back to a previous commit but keep working changes
git stash           # temporarily shelve uncommitted changes
git stash apply     # re-apply stash and keep it
git stash pop       # re-apply stash and delete it
git stash list      # list stashes
git reflog          # get back to ANY previous state (local only)
```

#### Error: Failed to Push Some Refs
Usually means you forgot to fetch + merge before pushing:

```bash
git stash
git pull --ff-only
git stash pop
```

#### Resources
- [atlassian.com/git/tutorials](https://atlassian.com/git/tutorials)
- [github.com/git-guides](https://github.com/git-guides)

---

### AWK: Text Processing Tricks

*Enrique Lau — [Community Notes](https://bit.ly/4bsGyDX)*

References: [ss64.com/mac/awk.html](https://ss64.com/mac/awk.html) · [awk.dev](https://awk.dev) · [GNU AWK Manual](https://www.gnu.org/software/gawk/manual/gawk.html)

#### Basics
AWK processes text line by line. Fields = columns. Default field separator = whitespace. `$0` = full line; `$1`, `$2`, etc. = individual fields. `{print}` and `{print $0}` are identical.

```bash
# Print all lines mentioning macOS from install history
system_profiler SPInstallHistoryDataType | awk '/macOS/{print}'

# BEGIN runs before input; END runs after
awk 'BEGIN {print "Hello, world!"} END {print "Goodbye!"}' < /dev/null

# Print first field of matching lines
echo "macOS Sonoma" | awk '/macOS/ {print $1}'   # → macOS
echo "macOS Sonoma" | awk '/macOS/ {print $2}'   # → Sonoma
```

#### Custom Field Separator (-F)
```bash
# Get Mac model from ioreg
ioreg -c IOPlatformExpertDevice | awk -F'"' '/"model"/ {gsub(/<|>/, "", $4); print $4}'
```

Breaking it down:
- `-F'"'` — set `"` as the field separator
- `/"model"/` — match lines containing "model"
- `gsub(/<|>/, "", $4)` — strip `<` and `>` from field 4

#### Built-in String Functions
- `gsub(r, s)` — global substitution: replace all matches of `r` with `s` in the current line (or specified variable)

#### AWK Can Also...
- Compute sums and averages
- Control flow: `if/else`, `while`, `for` loops
- Arrays

---

### Insider Tips for Efficient Mac Administration

*[Community Notes](https://bit.ly/3LdkSRp)*

#### Terminal Tricks
- `pbcopy` — copy from STDIN to clipboard: `cat file.txt | pbcopy`
- `pbpaste` — paste from clipboard to STDOUT
- Enable Touch ID for `sudo` (edit `/etc/pam.d/sudo_local`)

#### macOS Shortcuts
- **Shortcuts app:** built-in QR code generator, OCR from screenshot

#### Slack
- `Shift+Esc` — clear all unread messages

#### Read-Only Friday
Reserve a recurring block (e.g., Fridays) for no-risk work:
- Write and update documentation
- Clear tickets, update calendar, update shared agendas
- Review the past week and plan the next
- Professional development — certs, reading, etc.
- Test questionable equipment; decommission old gear
- Inventory audit: is the thing actually where the database says it is?
- Update the workbench

#### Decentralize the Knowledge
- Document early and often in a version-controlled system
- Share documentation with as many people as possible
- Show others how to improve existing docs and create their own

#### Check Your Tone
- [goblin.tools/Judge](https://goblin.tools/Judge) — paste a draft message to see if it reads as harsher than you intended

#### Highly Recommended Tools
- [Mist](https://github.com/ninxsoft/Mist-CLI) — download macOS installers and firmware
- [lowprofile](https://github.com/ninxsoft/LowProfile) — inspect and validate config profiles
- [Particulars](https://particulars.app) — system info in the menu bar
- [DFU Blaster](https://github.com/hpux735/dfublaster) — put Macs in DFU mode via GUI
- `macvdmtool` — command-line equivalent of DFU Blaster
- [Apparency](https://www.mothersruin.com/software/Apparency/) & [Suspicious Package](https://www.mothersruin.com/software/SuspiciousPackage/) — inspect app bundles and packages before installing
- [iMazing Profile Editor](https://imazing.com/profile-editor) — create and edit config profiles
- [Rectangle](https://rectangleapp.com) — window management
- [Mactracker](https://mactracker.ca) — Mac model database

#### Honorable Mentions
- [Hammerspoon](https://www.hammerspoon.org) — scriptable window management; great for consistent screenshot framing
- [github.com/smashism/awesome-macadmin-tools](https://github.com/smashism/awesome-macadmin-tools) — curated Mac admin tool list
- [tot.rocks](https://tot.rocks) — collect, edit, and sync text snippets
- [Monarch Launcher](https://www.monarchlauncher.com)

---

### Managing Macs with Intune

*Sam Gibbs & Andrew Myers — [Community Notes](https://bit.ly/3VRu7LV) — [GitHub Repos](https://alectrona.com/MacAdmins2024)*

#### Check-in Timing
- At enrollment: every 15 min for first hour
- After enrollment: ~every 8 hours
- Force sync: via Company Portal or Intune Console (may require user interaction)

#### ADE Enrollment
- User Affinity with Modern Auth: leverages Entra ID authentication, assigns Intune license, establishes user affinity
- Shared devices: choose "without user affinity"; no auth required during Setup Assistant
- "Await Configuration" deploys all assigned LOB apps and profiles before user reaches desktop
- First new user is always created as **admin**
- Company Portal must be installed and deployed separately

#### BYOD Enrollment
- Done via Company Portal app
- Universal URL: `https://aka.ms/EnrollMyMac`
- Opens System Settings automatically after MDM profile download
- Immediately initiates compliance check; profiles, apps, and scripts install concurrently
- Registered as a personal device by default

#### Configuration Profiles

The Good:
- Settings Catalog: easy on/off toggles for individual keys
- Pre-configured templates available
- Can upload existing profiles (must be **unsigned**)

The Bad:
- One filter max per profile (include or exclude — not both)
- Editing a profile removes the original and applies the new one
- Plist files uploaded to Intune are **read-only** — any change requires a new upload
- Reporting is unreliable for confirming profile status or version across the fleet

Important:
- Can create profiles from preference files/plists, but only with key/value pairs

#### Scripts

Need to Know:
- Shell scripts (sh, bash, zsh) supported
- Requires Intune management agent
- **Variables are NOT supported**
- Scripts run concurrently with other Intune processes
- Cannot be made available in Company Portal

Gotchas:
- Intune only reports the **first** run of a recurring script — subsequent runs are silent
- Management agent checks for new/updated scripts every 8 hours
- Failures return hex-based error codes — add custom logging
- Scripts cannot be edited inline; changes require uploading a new file

Resources:
- [microsoft/shell-intune-samples](https://github.com/microsoft/shell-intune-samples) — dozens of MS-provided sample scripts

#### App Deployment

Built-in support (no extra config): Office, Edge, Defender

| Type | Highlights |
|---|---|
| **LOB (pkg)** | Must be signed; 2 GB limit; no pre/post scripts; can appear in Company Portal (user groups only) |
| **Unmanaged pkg** | Unsigned OK; supports pre/post scripts; installs via Installer; reporting is messy and installs can repeat |
| **DMG** | Must contain only .app(s); bundle ID + version required; users may see mount warning |
| **VPP** | Assigned in AxM → auto-appears in Intune; control auto-update behavior; required or available via Company Portal |

App versioning can be ignored or used to gate updates and prevent reinstalls. Reporting is unreliable, especially with payload-free pkgs.

#### Device Compliance
Supports enforcing: SIP, min/max OS, password requirements, encryption, firewall, Gatekeeper  
Actions for non-compliance: email user or lock device  
Conditional Access integration → self-remediation through Company Portal

#### Platform SSO (Public Preview as of PSUMac 2024)
- Joins Mac to Entra ID using PSSO
- Auth options: password, smart card, or Secure Enclave
- Secure Enclave recommended; passwordless possible
- Enables SSO for any Entra ID-integrated app

#### Useful Tools
- [Intune-uploader](https://github.com/almenscorner/intune-uploader) — AutoPkg → Intune pipeline
- [IntuneCD](https://github.com/almenscorner/IntuneCD) — backup and document Intune configurations
- [IntuneMacODC](https://github.com/markstan/IntuneMacODC) — gather system info and logs from Intune-managed Macs
- [SupportCompanion](https://github.com/macadmins/SupportCompanion) — support app for Intune + Munki deployments
- [Santa](https://github.com/google/santa) — app allow/block lists
- [Jamf Compliance Editor](https://trusted.jamf.com/docs/establishing-compliance-baselines)
- swiftDialog + [Baseline](https://github.com/SecondSonConsulting/Baseline) for app deployment notifications (MS sample script in shell-intune-samples)

---

### SwiftUI for macOS Intro

*[Community Notes](https://bit.ly/3LbVsDK) — [Project Files](https://bit.ly/psu-intro-swiftui-files)*

#### Bonus Tip: Unsign a Config Profile
```bash
security cms -D \
  -i /path/to/source.mobileconfig \
  -o /path/to/decrypted.mobileconfig
```

#### App Structure
- `@main` — marks the entry point of the app
- `Body` — contains one or more scenes
- Drag `Constants.swift` into the Xcode window to integrate constants

#### SwiftUI Views
- Represent a piece of UI — from a simple `Text` label to complex interactive elements
- Can contain other views
- **Modifiers** change appearance and behavior of views
- **Stacks** arrange views: `VStack` (vertical), `HStack` (horizontal)

#### Data Model (ViewModel)
- Separates business logic from the view layer
- `@Published` properties notify views of changes automatically

#### App Sandbox
- Isolates apps from each other and from the system
- Limits potential damage from a compromised app
- Apps request access to specific directories via user consent

---

## PSUMac 2025

### Working with PSSO

*Christopher Scalisce — [Community Notes](https://docs.google.com/document/d/1crUCQ359GcCyzibQSm7tLcOBw-FEl07KHDbCKSWhOyQ/edit)*

#### Profile Setup (Entra as IdP)
Follow guidelines from both Jamf and Microsoft. Jamf enrollment uses a Customization profile.

Key profile fields:
- **Use Platform SSO** — allow user to sign in once at login window, then auto-sign in to apps/websites (macOS 13+)
- **Authentication Method** — password, Secure Enclave, or smart card (smart card: macOS 14+)
- **Registration Token** — token used by device to register with IdP without a password (macOS 13+)
- **Custom Configuration** — plist with key/value pairs for custom settings

> Keep Company Portal up-to-date — an outdated Company Portal can break logins.

#### Custom Config: Microsoft SSOv13.plist — Key Fields
- `AppPrefixAllowList` — bundle ID prefixes granted SSO. Include at minimum:
  `com.microsoft.`, `com.apple`, `com.jamf.`, `com.jamfsoftware.`, `com.netskope.`, plus any Adobe/other enterprise apps
- `browser_sso_interaction_enabled: 1` (integer)
- `disable_explicit_app_prompt: 1` (integer)

#### Password Mode vs. Secure Enclave Mode

| | Password | Secure Enclave |
|---|---|---|
| Local password synced with IdP | Yes | No |
| Passkeys supported | — | Extra setup step required |
| Local password requirements | From IdP | Set via MDM profile |

**Recommended:** test Secure Enclave on pilot devices before broad rollout.

#### WPJ Key Migration to Secure Enclave
Microsoft is moving to require the Workplace Join (WPJ) key be stored in the Secure Enclave:
- Devices already using PlatformSSO: already using Secure Enclave by default
- Devices using Microsoft SSO extension **without** PlatformSSO: add `use_most_secure_storage: true` (boolean) to extension config data
- Devices with WPJ key in Login Keychain will continue working until Microsoft activates enforcement

#### Multiple Users on Shared Macs
Profile key to map IdP account to correct local username (instead of everyone sharing one local account):

```xml
<key>TokenToUserMapping</key>
<string>AccountName</string>
<key>AccountName</key>
<string>com.apple.PlatformSSO.AccountShortName</string>
```

---

### Mastering Macs with Intune

*Sam Gibbs & Andrew Myers — [Community Notes](https://docs.google.com/document/d/1vVphwJPJv3K6X_mVLbznWTLKUzXtF6wicrljyFU2Kyk/edit) — [Slides](https://bit.ly/mastering-macs-intune)*

#### Four New MDM Check-in Triggers
1. Assignment changes on compliance profiles
2. Config profile payload changes
3. Entra group membership changes
4. VPP App Store app version updates

#### What Intune Does Well
- **M365 ecosystem:** built-in Entra IDP, easy Microsoft app deployment, Defender integration, Conditional Access + App Protection Policies
- **Settings Catalog:** DDM-based settings alongside traditional MDM; sync workflow with Apple's GitHub repo
- **Graph API:** RESTful access to create/update profiles, scripts, filters, packages, reports; [microsoft/msgraph-intune-samples](https://github.com/microsoft/msgraph-intune-samples); community tools: [IntuneCD](https://github.com/almenscorner/IntuneCD), [Intuneomator](https://github.com/almenscorner/Intuneomator)
- **BYOD + MAM:** same enrollment UX across device types; App Protection Policies control corporate data access on non-corporate devices
- Recovery Key lookups from web or mobile
- **Remote Help:** web or app-based; managed and unmanaged connections (additional license required)
- **One pane of glass:** Windows, iOS, Android, macOS unified; tvOS/visionOS coming; Privileged Access Control for IT (zero trust elevation, optional multi-approval)

#### What Needs Third-Party Help

**Enrollment:** Intune provides no built-in guided onboarding, app installs at setup, SSO, or app blocking. Look at swiftDialog, [Setup Your Mac](https://snelson.us/sym), [Baseline](https://github.com/SecondSonConsulting/Baseline).

**App management** beyond built-ins: [AutoPkg](https://github.com/autopkg/autopkg), [Munki](https://github.com/munki/munki), [Installomator](https://github.com/installomator/installomator), [Alectrona Patch](https://alectrona.com/patch/), [IntuneBrew](https://github.com/ugurkocde/IntuneBrew)

**App restrictions:** [Santa](https://github.com/google/santa)

**Reporting — Custom Attributes** (similar to Jamf EAs):
- Run every 8 hours
- Viewable globally, not on individual device records
- Sample scripts: [github.com/microsoft/shell-intune-samples — macOS/Custom Attributes](https://github.com/microsoft/shell-intune-samples/tree/master/macOS/Custom%20Attributes)

#### Migrating to Intune
1. **Review** current workflows: enrollment, app stack, security configs
2. **Design** in Intune: replicate workflows, modernize where possible
3. **Test + Pilot:** identify test users early, resolve issues fast, build docs
4. **Migrate:** with macOS Tahoe, use AxM for seamless MDM migration without erasure

---

### AxM API

*Weldon Dodd & Arek Dreyer — [Community Notes](https://docs.google.com/document/d/1HqnvEc5gflgM5-jjHordqj_3VqQG0diVvFevd5Ykets/edit)*

#### New Device Detail Fields
- Activation Lock status
- Device storage info
- Cellular: IMEI and EID
- Who released a device and when
- iPad/iPhone MAC address and Bluetooth address
- *(Coming soon)* AppleCare coverage status

#### Why Use the API?
- Automations and asset management
- Network access control
- eSIM provisioning
- Device release reporting
- Assign/reassign devices

Current limitations:
- Cannot set MDM re-assign enforcement date via API (yet)
- Cannot release devices via API
- No granular access control — all-or-nothing

#### Auth Flow
1. Create API account → generate private key → download PEM file → copy Client ID & Key ID
2. Generate a Client Assertion
3. Exchange Client Assertion for a JWT
4. Use JWT in API requests

> Client ID is used for *both* "Client ID" and "Team ID" in scripting definitions.

Python dependencies: `requests`, `authlib`, `pycryptodome`

#### Available Endpoints
- Get org devices / device info
- Get device management services
- Get serial numbers for a device management service
- Get/set assigned device management service for a device
- Assign or unassign a device to a device management service
- Get org device activity info

---

## Apple IT Sessions

### Apple Summer 2025 Tech Update

*Apple SE Briefing — WWDC highlights and what's new for IT*

#### Hardware
- **MacBook Air M4:** supports 2 external displays + open internal display
- **Mac Studio:** M4 Max or M3 Ultra + Thunderbolt 5
- **iPad "A16":** successor to iPad 10th gen
- **iPad Air M3**

#### What's New for IT
- Mac: Live Activities mirrored from connected iPhone; Control Center updates
- iPad: app window management (resize, minimize, full screen, close), Menu button, File/Edit/View toolbar

#### AxM Updates
- MDM Migration without erasure, with configurable deadline — coming with macOS Tahoe
- **`softwareupdate` MDM method is deprecated** — will be dropped next year; migrate to Managed Software Updates now
- List of Personal Apple Accounts being used for work purposes (e-commerce, GSX, etc.) — available later 2025
- Option to restrict MAAs to Managed Devices only
- Device Inventory: AppleCare status now available
- AxM API now available (see above)
- Return to Service: MDM-pushed apps remain installed after reset
- App update management: enforce, disable, or pin to specific version — both App Store and PKGs
  - New Managed Apps API: supports passwords, certs, and identities; streamlines user auth
- Device Enrollment Manager — new admin account type
- Device Release History

#### Reference
- Apple KB 100100 — Security Release History

### Tokens, Tokens, Tokens

*Catriona McDonald*

#### Secure Token
- Introduced in macOS 10.13; originally given to the first **admin** user created
- Changed in macOS 11 to be given to the first user created (admin or not)
- FileVault does not need to be active for Secure Tokens to be granted
- From macOS 11, users with Secure Tokens are considered **volume owners**

#### Secure Token — Command Line
```bash
sysadminctl -secureTokenStatus <username>

sysadminctl -secureTokenOn <username> -password <password> \
  (interactive || -adminUser <admin name> -adminPassword <admin password>)

sysadminctl -secureTokenOff <username> -password <password> \
  (interactive || -adminUser <admin name> -adminPassword <admin password>)

fdesetup list -extended
```

#### Bootstrap Token
- Introduced in macOS 10.15 for MDM vendor support
- A partnership-type token between device and MDM
- Can authorize:
  - Software updates
  - Erase all contents and settings
  - Create new users when they first log in with Platform SSO

#### Bootstrap Token — Command Line
```bash
profiles install -type bootstraptoken
profiles remove -type bootstraptoken
profiles status -type bootstraptoken
profiles validate -type bootstraptoken
fdesetup list -extended
```

#### Secure Token & Bootstrap — Platform SSO Enrollment Flow
Setup Assistant → Remote Management → Account Creation → [Secure Token + Bootstrap Token issued] → IdP Login

---

## MacSysAdmins 2025

### Career Kext Not Loaded?

*Andrina Kelly — [Video](https://www.youtube.com/watch?v=BilI1Cr_dT4)*

A career development session for Mac admins on finding and staying aligned with what drives you. Built around a few reusable frameworks:

#### Push/Pull Framework
Use this to understand what's moving you — toward something or away from something.

**Push Factors** (what drives you away from a role or situation):
- Misalignment with values
- Frustration with processes
- Boredom or lack of challenge
- Burnout
- Lack of recognition
- Organizational dysfunction

**Pull Factors** (what draws you forward):
- Curiosity about new challenges
- Desire for greater impact
- Opportunities for growth
- Better alignment with motivators
- Inspiration from others' work
- New possibilities you hadn't considered

> **Tip:** Start a Push/Pull Log — note when something energizes or drains you. You're collecting data about yourself; patterns will emerge over time.

#### The Motivator Map
Ten motivators worth knowing yourself against:

**Autonomy · Achievement · Recognition · Strategic Thinking · Leadership · Relationships · Creativity · Stability · Balance · Cultural Fit**

Don't let the labels constrain you. What matters is what each concept means to *you* and how it shows up in *your* work. "Leadership" for one person means managing others; for another, it means being led well. Define what each motivator looks like in your specific context.

For your top 3, ask:
- What does this motivator mean to me, specifically?
- Is it showing up in my current role day-to-day?
- What would happen if it disappeared tomorrow?

#### Career Diagnostic (3 Questions)
Run this assessment periodically — especially when you notice persistent friction.

1. **Energy Check** — What specific tasks or interactions in the last two weeks left you energized? What left you drained? List 2–3 in each category.
2. **Motivator Gap Analysis** — From your top 3 motivators: which is most present in your current role? Which is most absent? This surfaces where friction is coming from.
3. **Small Moves Assessment** — What's one small adjustment you could make to better align with your missing motivator? What's one conversation you could have this week?

#### Further Reflection Questions
- What problem do you want to solve? *(Alternative to "What do you want to be?")*
- When was the last time you felt genuinely excited to start your workday?
- What would happen if your strongest motivator disappeared from your role tomorrow?
- What's one thing you're curious about that's not part of your current job?

#### Resources
- [Personal User Manual Template](https://github.com/camin-mccluskey/personal-user-manual-template) — camin-mccluskey on GitHub