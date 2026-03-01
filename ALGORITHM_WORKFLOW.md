# Algorithmic Workflow: Timetable Generation

The scheduling process in this project utilizes a custom **Backtracking Algorithm** enhanced with **Constraint Satisfaction Programming (CSP)** and smart heuristic optimizations. It is designed to navigate an immensely dense search space (attempting to perfectly pack 42 periods into a 42-period week) within seconds.

Here is the exact step-by-step workflow of the algorithm:

## 1. Data Initialization & Setup
When the user triggers `POST /api/timetable/generate`:
- **Database Query**: The algorithm fetches all `Sections`, `Subjects`, `Faculty`, and `Rooms` via Prisma.
- **Event Expansion**: The system loops through every subject required by a section and expands them into discrete `Event` objects based on `sessionsPerWeek`. 
  - For example, if a "Machine Learning" theory subject requires 4 sessions a week, the algorithm duplicates it into 4 individual `Event` blocks, each with a `duration` of 1 hour. A Lab subject might have a `duration` of 2 or 3 hours.

## 2. Event Sorting Heuristic (Search Space Shaping)
To prevent the backtrack system from getting stuck in deep, narrow mathematical dead-ends, the `Event` array is ordered using a specific heuristic:
- **Shuffle**: All events are randomly shuffled first. This widens the backtracking search tree, preventing deterministic starvation where the algorithm repeats the exact same failing path.
- **Duration Prioritization**: Labs (events with `duration > 1`) are sorted to the very front of the queue. Since a 3-hour contiguous block is much harder to place on a Friday afternoon than a 1-hour block, placing massive blocks first ensures a geometrically stable foundation.

## 3. The Recursive Backtracking Solver (`solve`)
The core work is done by a recursive function that attempts to place `Event N` into the 6-day × 7-period grid.
1. The solver picks the next available `Event` from the queue.
2. It iterates through all 6 Days (MON to SAT) and all 7 Periods (1 to 7).
3. At each slot, it invokes the **`isValid`** constraint checker.
4. If `isValid` returns `true`, the event is temporarily saved to the `Schedule` array, and the function recursively calls itself for `Event N + 1`.
5. If it reaches a dead end (a Friday where no teacher is available), it **backtracks**: it removes the last successfully placed event, steps back to the previous function call, and tries the next available slot or teacher for that previous event.

## 4. Constraint Rules (`isValid`)
Before any event is committed to a slot, it must pass a rigorous gauntlet of structural checks:

### Basic Physical Bounds:
- Does the event exceed period 7? (A 3-hour lab assigned at Period 6 is rejected).
- **No Double Booking**: Is the Section already in a class at this slot? Is the Room already occupied? Is the chosen Faculty teaching another class?

### Room Type Strictness:
- Theory classes (`duration === 1`) are strictly locked to `THEORY` rooms.
- Lab classes (`duration > 1`) are strictly locked to `LAB` rooms.

### Faculty Capacity (MaxLoad):
- **Daily Limit**: A faculty member cannot teach more than 4 periods in a single day (to prevent burnout).
- **Weekly Limit**: The total assigned periods cannot exceed the `maxLoad` specified in the database.
- **Look-ahead Pruning**: Before assigning a teacher to a section's first ML class, the algorithm mathematically checks: *Does this teacher have enough remaining MaxLoad to teach the rest of this subject for the rest of the week?* If not, the algorithm immediately rejects the teacher, drastically speeding up processing by pruning doomed branches early.

### Strict Base Code Matching (Theory = Lab):
- The algorithm strips the "L" tag from a subject code (matching `CS101` Theory to `CSL101` Lab). 
- If the algorithm assigned "Professor Jagadeesh" to the very first `CS101` class on Monday, it will **strictly force** every subsequent `CS101` and `CSL101` class for that exact section to also be taught by Jagadeesh, blocking any other eligible faculty.

## 5. The "Pressure Valve" Fallback Limit
In dense scenarios (e.g., 3 sections each needing exactly 42 hours in a 42-hour week), perfectly satisfying the "Strict Base Code Tracking" rule often creates mathematically impossible puzzles (resulting in 1,000,000+ recursive iterations). 
To guarantee output in less than 3 seconds, the algorithm tracks deeply failed branches using a `limit.count`. 
- **If `limit.count` surpasses 50,000 loop operations**, the algorithm activates a soft fallback. 
- It gracefully relaxes the "Same Teacher for Theory and Lab" constraint exclusively for the remaining blocked classes, allowing it to rapidly slot an alternative teacher and finish the 100% full timetable successfully without crashing.
