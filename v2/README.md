# 🏛️ Maze Temple School V2

A complete redesign of the Maze Temple AI training system, focused on a **school metaphor** where you are the principal managing AI students learning to solve mazes.

## 🎯 Core Philosophy

**From:** Complex real-time training dashboards
**To:** Simple school management with snapshot playback

## 🏗️ Architecture

### Backend (Headless Training)
- **School**: Manages students and curriculum
- **Agent**: Base class for AI students
- **Specializations**: Explorer and Navigator types
- **Lesson**: Pre-designed maze challenges with grading rubrics
- **Recorder**: Captures attempts as snapshots (no live rendering)

### Frontend (Static + Playback)
- **Principal Dashboard**: Main UI with 4 views
  - Students: Roster with progress tracking
  - Curriculum: Browse available lessons
  - Classroom: Conduct lessons
  - Statistics: Class performance overview
- **MazeViewer**: Playback recorded attempts like security footage
- **ReportCard**: Simple A-F grades with metrics

## 📚 Phase 1 Features

### ✅ Implemented
- [x] 5 Kindergarten lessons (pre-designed mazes)
- [x] 2 AI specializations (Explorer, Navigator)
- [x] Snapshot recording system
- [x] Playback viewer with controls
- [x] Simple A-F grading system
- [x] Student enrollment and management
- [x] Progress tracking
- [x] localStorage persistence

### 🎓 Curriculum

**Kindergarten Lessons:**
1. **Straight Line** - Basic movement
2. **One Turn** - Learn to change direction
3. **T-Junction** - First decision point
4. **Simple Maze** - Navigate multiple turns
5. **Gem Collector** - Multi-objective navigation

## 🤖 Agent Specializations

### 🔍 Explorer
- **Motivation:** "What's around the corner?"
- **Strength:** Mapping unknown territory
- **Weakness:** Wanders off-task
- **Best at:** Discovery, exploration challenges

### 🧭 Navigator
- **Motivation:** "What's the optimal path?"
- **Strength:** Efficient pathfinding
- **Weakness:** Ignores side objectives
- **Best at:** Time trials, shortest-path challenges

## 🎮 How to Use

1. **Open `index.html`** in a web browser
2. **View Your Students** - See Explorer Eve and Navigator Nash
3. **Go to Classroom** - Select student and lesson
4. **Start Lesson** - Watch AI student attempt the maze
5. **Review Results** - Playback attempt and see grade

## 🔄 Key Differences from V1

| V1 | V2 |
|----|---|---|
| Random maze generation | Pre-designed curriculum |
| Live canvas rendering | Snapshot playback |
| Complex training metrics | Simple A-F grades |
| DQN with TensorFlow.js | Rule-based agents (Phase 1) |
| Real-time updates | "Security camera" style review |

## 🚀 Future Phases

### Phase 2: Social Learning
- Human demonstrations
- Co-op mode (human + AI)
- Guided practice with hints
- Side-by-side comparisons

### Phase 3: Full School
- 18 total lessons (through PhD level)
- 5 specializations (add Collector, Protector, Strategist)
- Advanced learning (tweaks system)
- Peer learning (agents watch each other)
- Custom lesson creator

## 🛠️ Technical Stack

- **Pure JavaScript** (ES6 modules)
- **HTML5 Canvas** (static rendering)
- **CSS3** (clean, modern UI)
- **localStorage** (persistence)
- **No frameworks** - vanilla JS for simplicity

## 📂 File Structure

```
v2/
├── index.html              # Entry point
├── app.js                  # Main application
├── core/
│   ├── school.js          # School management
│   ├── agent.js           # Base agent class
│   ├── lesson.js          # Lesson conductor
│   ├── maze.js            # Static maze representation
│   ├── recorder.js        # Snapshot recording
│   └── specializations/
│       ├── explorer.js    # Explorer agent
│       └── navigator.js   # Navigator agent
├── lessons/
│   └── kindergarten.js    # 5 starter lessons
└── ui/
    ├── dashboard.js       # Principal dashboard
    ├── maze-viewer.js     # Playback viewer
    ├── report-card.js     # Grade display
    └── styles.css         # All styles
```

## 🎨 Design Principles

1. **Simplicity Over Complexity** - Easy to understand and use
2. **Pre-designed Over Random** - Quality, crafted lessons
3. **Snapshot Over Live** - No performance issues
4. **Grades Over Metrics** - Simple evaluation
5. **School Metaphor** - Intuitive mental model

## 📝 License

Same as Maze Temple V1

---

**Ready to run a school? Open `index.html` and start teaching!** 🎓
