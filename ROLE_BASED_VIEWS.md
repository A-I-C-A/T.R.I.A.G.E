# TRIAGELOCK Role-Specific User Interfaces

## 🎯 Cognitive Load Reduction Strategy

**Core Philosophy**: Every role sees ONLY what they need to act on, EXACTLY when they need it.

---

## 👨‍⚕️ DOCTOR VIEW: Decision Fatigue Fighter

### Problem Doctors Face
- 20+ patients waiting
- Constant interruptions
- "Who needs me most?"
- Decision fatigue after 8-hour shift
- Critical information buried in charts

### TRIAGELOCK Doctor Dashboard

#### Main Screen Layout
```
┌─────────────────────────────────────────────────────────┐
│  🏥 TRIAGELOCK - Dr. Smith                              │
│  City General Hospital | 14:30 | 8 patients assigned   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🔴 IMMEDIATE ATTENTION (2)                             │
├─────────────────────────────────────────────────────────┤
│  Patient A - Bay 3 | CHEST PAIN                         │
│  ⚠️ UNSTABLE: HR 145, BP 175/100, O2 91%               │
│  🕐 Waiting: 3 minutes | Score: 95                      │
│  📋 Auto-Actions Done:                                  │
│     ✅ ECG ordered | ✅ Troponin labs sent              │
│     ✅ Aspirin administered | ✅ IV access established   │
│  🎯 NEXT STEP: Examine immediately, consider cath lab   │
│                                                          │
│  [START TREATMENT] [VIEW FULL CHART] [CONSULT CARDIO]   │
├─────────────────────────────────────────────────────────┤
│  Patient B - Bay 7 | UNRESPONSIVE                       │
│  ⚠️ CRITICAL: GCS 6, RR 8/min, O2 87%                  │
│  🕐 Waiting: 1 minute | Score: 102                      │
│  📋 Auto-Actions Done:                                  │
│     ✅ Airway secured | ✅ O2 15L via NRB               │
│     ✅ CT head ordered | ✅ Neuro consult paged         │
│  🎯 NEXT STEP: Assess airway, prepare for intubation    │
│                                                          │
│  [START TREATMENT] [INTUBATE] [TRANSFER TO ICU]         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🟡 URGENT - NEXT IN QUEUE (3)                          │
├─────────────────────────────────────────────────────────┤
│  Patient C - Bay 12 | ABDOMINAL PAIN                    │
│  ⚠️ Stable vitals, moderate pain (7/10)                │
│  🕐 Waiting: 22 minutes | Score: 58                     │
│  🎯 NEXT STEP: Abdominal exam, consider ultrasound      │
│  [SEE PATIENT]                                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🟢 STABLE - CAN WAIT (3)                               │
│  [EXPAND TO VIEW]                                        │
└─────────────────────────────────────────────────────────┘

Smart Alerts:
🔔 Patient D (YELLOW) waiting 45 minutes - will escalate to RED in 15 min
🔔 Lab results ready for Patient E - review before seeing
```

### Cognitive Load Reduced By:
1. **Pre-Sorted Priority**: No mental ranking needed
2. **Auto-Completed Prep Work**: ECG, labs, meds already ordered
3. **Next Step Guidance**: Not diagnosis, just "what to do next"
4. **Time Awareness**: Shows who's been waiting too long
5. **One-Click Actions**: Start treatment, order consults, transfer

### What Doctors DON'T See:
- ❌ Administrative alerts (bed availability)
- ❌ Staffing issues
- ❌ Patient billing information
- ❌ Non-urgent notifications

**Focus**: Clinical care only.

---

## 👩‍⚕️ NURSE VIEW: Chaos Manager

### Problem Nurses Face
- Responsible for 8-12 patients simultaneously
- Constant vital sign monitoring
- Medication timing
- Multiple doctors giving orders
- Can't remember who needs what when

### TRIAGELOCK Nurse Dashboard

#### Main Screen Layout
```
┌─────────────────────────────────────────────────────────┐
│  🏥 TRIAGELOCK - Nurse Johnson                          │
│  City General Hospital | 14:30 | 10 patients assigned  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🔥 URGENT TASKS - DO NOW (3)                           │
├─────────────────────────────────────────────────────────┤
│  🔴 Patient 3 (Bay 5) - VITALS OVERDUE                  │
│  ⚠️ Last check: 18 minutes ago (15 min interval due)   │
│  🎯 ACTION: Take vitals immediately - auto-escalating   │
│  [RECORD VITALS NOW]                                     │
├─────────────────────────────────────────────────────────┤
│  🔔 Patient 7 (Bay 11) - OXYGEN ALARM                   │
│  ⚠️ O2 sat dropped from 95% → 88% (3 min ago)          │
│  🎯 ACTION: Check patient, increase O2, notify MD       │
│  [ACKNOWLEDGE] [NOTIFY DR. SMITH]                        │
├─────────────────────────────────────────────────────────┤
│  💊 Patient 1 (Bay 2) - MEDICATION DUE                  │
│  ⚠️ Pain meds due in 2 minutes                          │
│  🎯 ACTION: Administer morphine 4mg IV                  │
│  [GIVE MEDICATION] [DELAY 15 MIN]                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ⏰ UPCOMING TASKS - NEXT 30 MINUTES (5)                │
├─────────────────────────────────────────────────────────┤
│  14:35 - Patient 5: Vitals check                        │
│  14:40 - Patient 2: IV antibiotics                      │
│  14:45 - Patient 8: Reassess pain level                 │
│  14:50 - Patient 4: Wound dressing change               │
│  15:00 - Patient 6: Vitals check                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  📊 MY PATIENTS AT A GLANCE                             │
├─────────────────────────────────────────────────────────┤
│  🔴 Patient 1: Stable | Last vitals: 10 min | Bay 2     │
│  🔴 Patient 3: NEEDS VITALS | Last: 18 min | Bay 5      │
│  🟡 Patient 2: Stable | IV running | Bay 4              │
│  🟡 Patient 7: O2 ALARM | Check now | Bay 11            │
│  🟢 Patient 5: Stable | Next check 14:35 | Bay 9        │
│  ... 5 more                                              │
└─────────────────────────────────────────────────────────┘

Smart Supplies:
📦 Auto-Generated Supply List for Next Hour:
   - 3× Blood pressure cuffs
   - 2× IV start kits
   - 5× Medication syringes
   - 1× Wound care supplies
```

### Cognitive Load Reduced By:
1. **Task Prioritization**: System tells you what's most urgent
2. **Time Management**: Automatic scheduling of routine checks
3. **Medication Reminders**: Never miss a dose
4. **Alert Fatigue Reduction**: Only critical alerts shown
5. **Supply Planning**: Pre-generated lists

### What Nurses DON'T See:
- ❌ Detailed triage scores
- ❌ Diagnostic reasoning
- ❌ Hospital-wide statistics
- ❌ Transfer coordination

**Focus**: Patient care tasks only.

---

## 🏥 ADMIN VIEW: Helplessness to Empowerment

### Problem Admins Face
- Hospital overwhelmed but don't know why
- Can't see bottlenecks in real-time
- Reactive (put out fires) vs proactive
- No control over patient flow

### TRIAGELOCK Admin Dashboard

#### Main Screen Layout
```
┌─────────────────────────────────────────────────────────┐
│  🏥 TRIAGELOCK ADMIN CONTROL CENTER                     │
│  City General Hospital | Sunday 14:30                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🚨 CRITICAL ALERTS - ACTION REQUIRED (2)               │
├─────────────────────────────────────────────────────────┤
│  ⚠️ ICU AT CAPACITY                                     │
│  Status: 30/30 beds (100%) | 2 RED patients waiting     │
│  Impact: Cannot admit critical patients                  │
│  📊 Trend: +5 patients in last 2 hours                  │
│                                                          │
│  🎯 RECOMMENDED ACTIONS:                                │
│     1. Contact Metro General (8 ICU beds available)     │
│     2. Prepare ED for extended critical care            │
│     3. Alert medical director for staffing surge        │
│                                                          │
│  [INITIATE TRANSFER] [ACTIVATE SURGE PLAN] [ALERT MD]   │
├─────────────────────────────────────────────────────────┤
│  ⚠️ NURSING STAFF SHORTAGE                              │
│  Status: 18/40 nurses (45% - CRITICAL SHORTAGE)         │
│  Impact: +2 hour wait time increase                     │
│  📊 Trend: 3 nurses called in sick this shift          │
│                                                          │
│  🎯 RECOMMENDED ACTIONS:                                │
│     1. Call in 5 on-call nurses (auto-list generated)   │
│     2. Request float nurses from medical-surgical       │
│     3. Consider ambulance diversion in 1 hour           │
│                                                          │
│  [CALL ON-CALL STAFF] [REQUEST FLOATS] [PREPARE DIVERT] │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  📊 REAL-TIME CAPACITY DASHBOARD                        │
├─────────────────────────────────────────────────────────┤
│  General Beds:  ████████████░░░░  150/200 (75%)        │
│  ICU Beds:      ████████████████  30/30 (100%) 🔴      │
│  ED Bays:       ████████████░░░░  38/50 (76%)          │
│                                                          │
│  Current Queue:                                          │
│    🔴 RED (Critical):    8 patients | Avg wait: 5 min   │
│    🟡 YELLOW (Urgent):   22 patients | Avg wait: 35 min │
│    🟢 GREEN (Standard):  18 patients | Avg wait: 95 min │
│    🔵 BLUE (Minor):      12 patients | Avg wait: 180min │
│                                                          │
│  Staff on Duty:                                          │
│    👨‍⚕️ Physicians:  12/20 (60%) ⚠️                      │
│    👩‍⚕️ Nurses:     18/40 (45%) 🔴                      │
│    🏥 Specialists: 5/8 (63%) ⚠️                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  📈 PREDICTIVE INDICATORS                               │
├─────────────────────────────────────────────────────────┤
│  Patient Arrival Rate: 8 per hour (↑ trending)          │
│  Discharge Rate: 4 per hour (↓ trending)                │
│                                                          │
│  ⚠️ FORECAST: Full capacity in 45 minutes               │
│                                                          │
│  🎯 PROACTIVE ACTIONS AVAILABLE:                        │
│     □ Activate ambulance diversion at 16:00             │
│     □ Transfer 12 GREEN patients to urgent care         │
│     □ Request additional staffing for evening shift     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🔄 TRANSFER CANDIDATES (System-Generated)              │
├─────────────────────────────────────────────────────────┤
│  12 stable GREEN patients suitable for transfer:        │
│                                                          │
│  Patient ID   | Condition        | Wait Time | Bay      │
│  PT-2025-018  | Minor fracture   | 135 min   | Bay 15   │
│  PT-2025-022  | UTI              | 98 min    | Bay 18   │
│  PT-2025-031  | Sprained ankle   | 156 min   | Bay 22   │
│  ... 9 more                                              │
│                                                          │
│  Nearby Facilities with Capacity:                       │
│    ✅ Urgent Care East: 15 min away, 0 wait             │
│    ✅ Orthopedic Clinic: 20 min away, 30 min wait       │
│                                                          │
│  [GENERATE TRANSFER LIST] [ARRANGE TRANSPORT]           │
└─────────────────────────────────────────────────────────┘
```

### Cognitive Load Reduced By:
1. **Situation Awareness**: One screen shows entire hospital status
2. **Actionable Insights**: Not just "problem" but "here's the fix"
3. **Predictive Alerts**: Know problems before they become crises
4. **Auto-Generated Solutions**: Transfer lists, staffing calls
5. **Control**: Clear actions admin can take right now

### What Admins DON'T See:
- ❌ Individual patient medical details
- ❌ Clinical decision-making
- ❌ Medication administration

**Focus**: System-level optimization and resource allocation.

---

## 🏛️ GOVERNMENT VIEW: Multi-Hospital Oversight

### Problem Government Officials Face
- No regional visibility
- Can't coordinate between hospitals
- Reactive to disasters, not proactive
- Data delayed by 24-48 hours

### TRIAGELOCK Government Dashboard

#### Main Screen Layout
```
┌─────────────────────────────────────────────────────────┐
│  🏛️ REGIONAL EMERGENCY COORDINATION CENTER              │
│  Ministry of Health | Metropolitan Region | 14:30       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🚨 ACTIVE CRISIS SITUATIONS (1)                        │
├─────────────────────────────────────────────────────────┤
│  🔴 CITY GENERAL HOSPITAL - MASS CASUALTY SURGE         │
│  Location: Downtown, Main Street                         │
│  Status: ICU 100%, 60 patients waiting, staff shortage  │
│  Duration: 2 hours (ongoing)                             │
│                                                          │
│  🎯 COORDINATION ACTIONS NEEDED:                        │
│     1. Metro General has 8 ICU beds - initiate transfer │
│     2. Regional Medical Center has 12 ED staff on-call  │
│     3. Activate mutual aid protocol with 3 hospitals    │
│     4. Consider National Guard medical team request     │
│                                                          │
│  [COORDINATE TRANSFER] [ACTIVATE MUTUAL AID] [ESCALATE] │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🗺️ REGIONAL HOSPITAL STATUS MAP                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│      🔴 City General (100% ICU, 85% beds)               │
│             ↓ 3 patients transferred                     │
│      🟢 Metro General (60% ICU, 65% beds)               │
│                                                          │
│  🟡 Central Medical (85% ICU, 78% beds)                 │
│             ↓ 2 patients transferred                     │
│      🟢 Regional Medical (55% ICU, 60% beds)            │
│                                                          │
│  🟢 Metropolitan Clinic (40% beds, no ICU)              │
│                                                          │
│  [VIEW FULL MAP] [OPTIMIZE TRANSFERS]                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  📊 REGIONAL STATISTICS (Last 24 Hours)                 │
├─────────────────────────────────────────────────────────┤
│  Total Patients: 2,450 across 5 hospitals               │
│  Critical Cases: 180 (7.3%)                             │
│  Average Wait Time: 42 minutes                           │
│  Escalations: 95 (3.9%)                                 │
│  Transfers Coordinated: 23                               │
│  Ambulance Diversions: 4 incidents                      │
│                                                          │
│  🏆 Best Performing: Regional Medical Center            │
│     (18 min avg wait, 0 escalations)                    │
│  ⚠️ Needs Support: City General Hospital                │
│     (85 min avg wait, 45 escalations)                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  📈 CROWD SURGE MONITORING                              │
├─────────────────────────────────────────────────────────┤
│  Current Surges Detected: 1                             │
│                                                          │
│  City General Hospital:                                  │
│    Arrival Rate: 12 patients/hour (3x normal)           │
│    Duration: 2 hours                                     │
│    Cause: Unknown (possible event nearby)               │
│                                                          │
│  🎯 RECOMMENDED REGIONAL RESPONSE:                      │
│     □ Divert ambulances to Metro General (10 min away)  │
│     □ Deploy mobile triage unit                         │
│     □ Alert regional trauma coordinator                 │
│     □ Check for mass casualty incident                  │
└─────────────────────────────────────────────────────────┘
```

### Cognitive Load Reduced By:
1. **Regional View**: See all hospitals at once
2. **Coordination Tools**: One-click transfer coordination
3. **Early Warning**: Detect surges before they become disasters
4. **Resource Optimization**: Match capacity to demand across region

---

## 🎯 Summary: How TRIAGELOCK Reduces Cognitive Load

| Role | Sees | Doesn't See | Result |
|------|------|-------------|--------|
| **Doctor** | Priority patients, auto-completed prep work, next clinical steps | Admin alerts, capacity issues | Focus on clinical care, reduced decision fatigue |
| **Nurse** | Urgent tasks sorted by time, medication reminders, vital alerts | Triage scores, diagnostic reasoning | Clear task list, no missed interventions |
| **Admin** | Capacity metrics, actionable recommendations, bottlenecks | Patient medical details, clinical decisions | Proactive resource management |
| **Government** | Regional overview, surge detection, coordination tools | Individual patient data, hospital operations | Regional optimization, disaster prevention |

**Each role sees exactly what they can control, nothing more.**

This is how TRIAGELOCK fights the real problem: **information overload in emergency medicine.**
