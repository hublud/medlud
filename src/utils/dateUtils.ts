/**
 * Calculates age based on a birth date string
 * @param dobString - ISO date string or YYYY-MM-DD
 * @returns number of years
 */
export function calculateAge(dobString: string | null | undefined): number | null {
    if (!dobString) return null;
    
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return null;
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}
