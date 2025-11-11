/**
 * School class
 * Manages students (agents), curriculum, and lessons
 */

export class School {
    constructor(name = "Maze Temple School") {
        this.name = name;
        this.students = new Map(); // studentId -> Agent
        this.curriculum = new Map(); // difficulty -> Lesson[]
        this.classHistory = []; // Record of all class sessions
        this.storage = new SchoolStorage();
    }

    // Enroll a new student
    enrollStudent(agent) {
        this.students.set(agent.name, agent);
        this.save();
        return agent;
    }

    // Remove a student
    unenrollStudent(studentName) {
        this.students.delete(studentName);
        this.save();
    }

    // Get student by name
    getStudent(studentName) {
        return this.students.get(studentName);
    }

    // Get all students
    getAllStudents() {
        return Array.from(this.students.values());
    }

    // Set curriculum
    setCurriculum(difficulty, lessons) {
        this.curriculum.set(difficulty, lessons);
    }

    // Get curriculum for difficulty level
    getCurriculum(difficulty) {
        return this.curriculum.get(difficulty) || [];
    }

    // Get all curriculum
    getAllCurriculum() {
        const all = [];
        for (const lessons of this.curriculum.values()) {
            all.push(...lessons);
        }
        return all;
    }

    // Conduct a lesson for a student
    async conductLesson(studentName, lessonId) {
        const student = this.getStudent(studentName);
        if (!student) {
            throw new Error(`Student ${studentName} not found`);
        }

        const lesson = this.findLesson(lessonId);
        if (!lesson) {
            throw new Error(`Lesson ${lessonId} not found`);
        }

        // Run the lesson
        const result = await lesson.conduct(student);

        // Record in history
        this.classHistory.push({
            timestamp: Date.now(),
            student: studentName,
            lesson: lessonId,
            grade: result.grade,
            success: result.report.success
        });

        this.save();

        return result;
    }

    // Conduct lesson for multiple students (parallel)
    async conductClassLesson(studentNames, lessonId) {
        const promises = studentNames.map(name =>
            this.conductLesson(name, lessonId)
        );

        const results = await Promise.all(promises);

        return results.map((result, i) => ({
            student: studentNames[i],
            ...result
        }));
    }

    // Find a lesson by ID
    findLesson(lessonId) {
        for (const lessons of this.curriculum.values()) {
            const lesson = lessons.find(l => l.id === lessonId);
            if (lesson) return lesson;
        }
        return null;
    }

    // Get student progress report
    getStudentReport(studentName) {
        const student = this.getStudent(studentName);
        if (!student) return null;

        const totalLessons = this.getAllCurriculum().length;
        const completedLessons = student.completedLessons.size;
        const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

        return {
            name: student.name,
            specialization: student.specialization,
            level: student.level,
            experience: student.experience,
            overallGrade: student.getOverallGrade(),
            progress: Math.round(progress),
            completedLessons,
            totalLessons,
            grades: Array.from(student.grades.entries())
        };
    }

    // Get class statistics
    getClassStatistics() {
        const students = this.getAllStudents();
        const totalStudents = students.length;

        if (totalStudents === 0) {
            return {
                totalStudents: 0,
                averageLevel: 0,
                averageProgress: 0,
                gradeDistribution: {}
            };
        }

        const totalLevel = students.reduce((sum, s) => sum + s.level, 0);
        const averageLevel = totalLevel / totalStudents;

        const totalLessons = this.getAllCurriculum().length;
        const totalProgress = students.reduce((sum, s) => {
            return sum + (s.completedLessons.size / totalLessons) * 100;
        }, 0);
        const averageProgress = totalProgress / totalStudents;

        const gradeDistribution = {};
        students.forEach(s => {
            const grade = s.getOverallGrade();
            gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
        });

        return {
            totalStudents,
            averageLevel: averageLevel.toFixed(1),
            averageProgress: Math.round(averageProgress),
            gradeDistribution
        };
    }

    // Save to localStorage
    save() {
        this.storage.save(this);
    }

    // Load from localStorage
    static load() {
        const storage = new SchoolStorage();
        return storage.load();
    }
}

// localStorage persistence
class SchoolStorage {
    constructor() {
        this.storageKey = 'mazeTempleSchool_v2';
    }

    save(school) {
        const data = {
            name: school.name,
            students: Array.from(school.students.values()).map(s => s.toJSON()),
            classHistory: school.classHistory
        };

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save school data:', error);
        }
    }

    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (!data) return null;

            const parsed = JSON.parse(data);
            const school = new School(parsed.name);

            // Restore students (need to import Agent classes)
            // This will be handled by the app initialization
            school.classHistory = parsed.classHistory || [];

            return { rawData: parsed, school };
        } catch (error) {
            console.warn('Failed to load school data:', error);
            return null;
        }
    }

    clear() {
        localStorage.removeItem(this.storageKey);
    }
}

export { SchoolStorage };
