const supportsVibrate = () => (typeof navigator !== 'undefined' && 'vibrate' in navigator);
const getGamepads = () => (typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : []);

async function tryGamepadVibrate(duration = 50, weak = 0.2, strong = 0.6) {
    try {
        const gps = getGamepads();
        for (let i = 0; i < gps.length; i++) {
            const gp = gps[i];
            if (!gp) continue;
            try {
                const act = gp.vibrationActuator || (gp.hapticActuators && gp.hapticActuators[0]);
                if (act && typeof act.playEffect === 'function') {
                    await act.playEffect('dual-rumble', { startDelay: 0, duration: Math.max(10, duration), weakMagnitude: Math.min(1, weak), strongMagnitude: Math.min(1, strong) });
                }
            } catch (e) {
            }
        }
    } catch (e) {  }
}

export function vibrate(patternOrMs) {
    try {
        if (supportsVibrate()) {
            navigator.vibrate(patternOrMs);
        }
    } catch (e) {}
    try {
        const dur = Array.isArray(patternOrMs) ? (patternOrMs.reduce((a,b) => a + Math.max(0, b), 0) || 40) : (typeof patternOrMs === 'number' ? patternOrMs : 40);
        tryGamepadVibrate(dur);
    } catch (e) {}
}

export function buttonPress() { vibrate(12); }
export function boost() { vibrate(64); }
export function collision() { vibrate([90, 30, 40]); }
export function sliderSnap() { vibrate(10); }
export function weak() { vibrate(6); }

export default {
    vibrate,
    buttonPress,
    boost,
    collision,
    sliderSnap,
    weak
};
