export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export function getTimeOfDay(): TimeOfDay {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 20) return 'evening';
    return 'night';
}

export function getTextColorClass(timeOfDay: TimeOfDay): string {
    switch (timeOfDay) {
        case 'night':
            return 'text-white';
        case 'evening':
            return 'text-white';
        case 'morning':
        case 'afternoon':
        default:
            return 'text-sky-900';
    }
}

export function getTitleTextColorClass(timeOfDay: TimeOfDay): string {
    switch (timeOfDay) {
        case 'night':
            return 'text-white';
        case 'evening':
            return 'text-white';
        case 'morning':
        case 'afternoon':
        default:
            return 'text-sky-900';
    }
} 