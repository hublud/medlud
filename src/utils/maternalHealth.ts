export interface ANCVisit {
    week: number;
    label: string;
    description: string;
}

/**
 * Get the next ANC visit based on current gestational age
 * Following WHO ANC guidelines
 */
export function getNextANCVisit(currentWeek: number): ANCVisit | null {
    const ancSchedule: ANCVisit[] = [
        { week: 8, label: 'First ANC Visit', description: 'Initial booking and health assessment' },
        { week: 12, label: 'First Trimester Check', description: 'Early pregnancy screening' },
        { week: 16, label: 'Second ANC Visit', description: 'Growth monitoring and tests' },
        { week: 20, label: 'Third ANC Visit', description: 'Anatomy scan and check-up' },
        { week: 24, label: 'Fourth ANC Visit', description: 'Glucose screening and monitoring' },
        { week: 28, label: 'Fifth ANC Visit', description: 'Third trimester begins - monthly visits start' },
        { week: 32, label: 'Monthly Check-up', description: 'Position check and monitoring' },
        { week: 36, label: 'Weekly Visits Begin', description: 'Preparation for delivery' },
        { week: 37, label: 'Weekly Visit', description: 'Monitor readiness for birth' },
        { week: 38, label: 'Weekly Visit', description: 'Final preparations' },
        { week: 39, label: 'Weekly Visit', description: 'Almost time!' },
        { week: 40, label: 'Due Date Check', description: 'Your baby is ready to meet you!' }
    ];

    // Find the next visit that's after the current week
    const nextVisit = ancSchedule.find(visit => visit.week > currentWeek);

    return nextVisit || null;
}

/**
 * Get all ANC visits for reference
 */
export function getANCSchedule(): ANCVisit[] {
    return [
        { week: 8, label: 'First ANC Visit', description: 'Initial booking and health assessment' },
        { week: 12, label: 'First Trimester Check', description: 'Early pregnancy screening' },
        { week: 16, label: 'Second ANC Visit', description: 'Growth monitoring and tests' },
        { week: 20, label: 'Third ANC Visit', description: 'Anatomy scan and check-up' },
        { week: 24, label: 'Fourth ANC Visit', description: 'Glucose screening and monitoring' },
        { week: 28, label: 'Fifth ANC Visit', description: 'Third trimester begins' },
        { week: 32, label: 'Monthly Check-up', description: 'Position check and monitoring' },
        { week: 36, label: 'Weekly Visits Begin', description: 'Preparation for delivery' },
        { week: 37, label: 'Weekly Visit', description: 'Monitor readiness for birth' },
        { week: 38, label: 'Weekly Visit', description: 'Final preparations' },
        { week: 39, label: 'Weekly Visit', description: 'Almost time!' },
        { week: 40, label: 'Due Date Check', description: 'Your baby is ready!' }
    ];
}

/**
 * Get weekly encouragement message based on gestational age
 */
export function getWeeklyEncouragement(currentWeek: number): string {
    // First Trimester (0-13 weeks)
    if (currentWeek <= 6) {
        return "🌱 Your pregnancy journey has just begun! Take it easy and stay hydrated.";
    } else if (currentWeek <= 9) {
        return "💪 You're doing great! Remember to take your prenatal vitamins daily.";
    } else if (currentWeek <= 13) {
        return "✨ First trimester almost complete! Your baby is growing beautifully.";
    }

    // Second Trimester (14-27 weeks)
    else if (currentWeek <= 17) {
        return "🌟 Welcome to the second trimester! You might start feeling more energetic.";
    } else if (currentWeek <= 20) {
        return "👶 Halfway there! Your baby is growing stronger every day.";
    } else if (currentWeek <= 24) {
        return "💖 You're glowing! Keep up the healthy eating and gentle exercise.";
    } else if (currentWeek <= 27) {
        return "🎉 Third trimester is approaching! You're doing an amazing job.";
    }

    // Third Trimester (28-36 weeks)
    else if (currentWeek <= 30) {
        return "🌸 Final stretch! Start preparing your hospital bag and birth plan.";
    } else if (currentWeek <= 33) {
        return "💝 Your baby is getting ready to meet you! Rest when you can.";
    } else if (currentWeek <= 36) {
        return "🎀 Almost there! Make sure everything is ready for your little one.";
    }

    // Near Term (37-40 weeks)
    else if (currentWeek <= 38) {
        return "🌺 You're full term! Your baby could arrive any day now. Stay calm and ready.";
    } else if (currentWeek <= 40) {
        return "🎊 Your due date is here! Your baby will arrive when they're ready. You've got this!";
    }

    // Overdue (40+ weeks)
    else {
        return "🌈 Your baby will be here very soon! Stay in close contact with your healthcare provider.";
    }
}

/**
 * Calculate weeks remaining until due date (40 weeks)
 */
export function getWeeksRemaining(currentWeek: number): number {
    return Math.max(0, 40 - currentWeek);
}

/**
 * Get trimester information
 */
export function getTrimester(currentWeek: number): { number: number; name: string } {
    if (currentWeek <= 13) {
        return { number: 1, name: 'First Trimester' };
    } else if (currentWeek <= 27) {
        return { number: 2, name: 'Second Trimester' };
    } else {
        return { number: 3, name: 'Third Trimester' };
    }
}
