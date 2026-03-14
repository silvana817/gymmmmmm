const svgToDataUri = markup => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markup.replace(/>\s+</g, '><').trim())}`

function createFrame({ title, cue, step, accent = '#6c63ff', body }) {
    return svgToDataUri(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img" aria-label="${title} - ${cue}">
            <rect width="240" height="240" rx="24" fill="#0f172a" />
            <rect x="16" y="16" width="208" height="208" rx="20" fill="#111827" stroke="rgba(148,163,184,0.18)" />
            <text x="24" y="38" fill="#f8fafc" font-size="14" font-family="Arial, sans-serif" font-weight="700">${title}</text>
            <text x="24" y="56" fill="#94a3b8" font-size="11" font-family="Arial, sans-serif">${cue}</text>
            <rect x="178" y="24" width="38" height="18" rx="9" fill="${accent}" opacity="0.18" />
            <text x="197" y="37" text-anchor="middle" fill="${accent}" font-size="10" font-family="Arial, sans-serif" font-weight="700">${step}/2</text>
            ${body}
        </svg>
    `)
}

const commonBody = {
    floor: '<line x1="36" y1="184" x2="204" y2="184" stroke="rgba(148,163,184,0.35)" stroke-width="6" stroke-linecap="round" />',
    bars: '<line x1="70" y1="82" x2="70" y2="176" stroke="#334155" stroke-width="8" stroke-linecap="round" /><line x1="170" y1="82" x2="170" y2="176" stroke="#334155" stroke-width="8" stroke-linecap="round" />',
}

export const CUSTOM_EXERCISE_MEDIA = {
    custom_reverse_nordic: [
        createFrame({
            title: 'REVERSE NORDIC',
            cue: 'Start upright on your knees',
            step: 1,
            body: `
                ${commonBody.floor}
                <circle cx="120" cy="58" r="14" fill="#f8fafc" />
                <line x1="120" y1="74" x2="120" y2="122" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="120" y1="92" x2="96" y2="104" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="120" y1="92" x2="144" y2="104" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="120" y1="122" x2="104" y2="154" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="120" y1="122" x2="136" y2="154" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="104" y1="154" x2="96" y2="184" stroke="#00d4aa" stroke-width="8" stroke-linecap="round" />
                <line x1="136" y1="154" x2="144" y2="184" stroke="#00d4aa" stroke-width="8" stroke-linecap="round" />
            `,
        }),
        createFrame({
            title: 'REVERSE NORDIC',
            cue: 'Lean back while keeping hips open',
            step: 2,
            body: `
                ${commonBody.floor}
                <circle cx="152" cy="78" r="14" fill="#f8fafc" />
                <line x1="144" y1="92" x2="120" y2="132" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="132" y1="110" x2="108" y2="118" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="132" y1="110" x2="152" y2="124" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="120" y1="132" x2="106" y2="156" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="120" y1="132" x2="136" y2="156" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="106" y1="156" x2="96" y2="184" stroke="#00d4aa" stroke-width="8" stroke-linecap="round" />
                <line x1="136" y1="156" x2="144" y2="184" stroke="#00d4aa" stroke-width="8" stroke-linecap="round" />
            `,
        }),
    ],
    custom_l_sit: [
        createFrame({
            title: 'L-SIT',
            cue: 'Support body on bars',
            step: 1,
            body: `
                ${commonBody.bars}
                <line x1="70" y1="86" x2="170" y2="86" stroke="#334155" stroke-width="6" stroke-dasharray="4 8" opacity="0.4" />
                <circle cx="120" cy="54" r="13" fill="#f8fafc" />
                <line x1="120" y1="68" x2="120" y2="118" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="120" y1="84" x2="88" y2="112" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="120" y1="84" x2="152" y2="112" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="88" y1="112" x2="70" y2="112" stroke="#00d4aa" stroke-width="8" stroke-linecap="round" />
                <line x1="152" y1="112" x2="170" y2="112" stroke="#00d4aa" stroke-width="8" stroke-linecap="round" />
                <line x1="120" y1="118" x2="104" y2="146" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="120" y1="118" x2="136" y2="146" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
            `,
        }),
        createFrame({
            title: 'L-SIT',
            cue: 'Extend both legs forward',
            step: 2,
            body: `
                ${commonBody.bars}
                <circle cx="120" cy="54" r="13" fill="#f8fafc" />
                <line x1="120" y1="68" x2="120" y2="118" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="120" y1="84" x2="88" y2="112" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="120" y1="84" x2="152" y2="112" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="88" y1="112" x2="70" y2="112" stroke="#00d4aa" stroke-width="8" stroke-linecap="round" />
                <line x1="152" y1="112" x2="170" y2="112" stroke="#00d4aa" stroke-width="8" stroke-linecap="round" />
                <line x1="120" y1="118" x2="154" y2="118" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="120" y1="126" x2="154" y2="126" stroke="#00d4aa" stroke-width="8" stroke-linecap="round" />
            `,
        }),
    ],
    custom_fire_hydrant: [
        createFrame({
            title: 'FIRE HYDRANT',
            cue: 'Quadruped setup',
            step: 1,
            body: `
                ${commonBody.floor}
                <circle cx="88" cy="86" r="13" fill="#f8fafc" />
                <line x1="100" y1="92" x2="134" y2="110" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="112" y1="98" x2="96" y2="136" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="130" y1="108" x2="122" y2="148" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="118" y1="102" x2="148" y2="132" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="146" y1="128" x2="150" y2="170" stroke="#00d4aa" stroke-width="8" stroke-linecap="round" />
                <line x1="122" y1="148" x2="118" y2="184" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
            `,
        }),
        createFrame({
            title: 'FIRE HYDRANT',
            cue: 'Lift knee out to the side',
            step: 2,
            body: `
                ${commonBody.floor}
                <circle cx="88" cy="86" r="13" fill="#f8fafc" />
                <line x1="100" y1="92" x2="134" y2="110" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="112" y1="98" x2="96" y2="136" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="130" y1="108" x2="122" y2="148" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="118" y1="102" x2="148" y2="132" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="148" y1="132" x2="182" y2="108" stroke="#00d4aa" stroke-width="8" stroke-linecap="round" />
                <line x1="122" y1="148" x2="118" y2="184" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
            `,
        }),
    ],
    custom_burpees: [
        createFrame({
            title: 'BURPEES',
            cue: 'Drop hands and feet to the floor',
            step: 1,
            accent: '#f59e0b',
            body: `
                ${commonBody.floor}
                <circle cx="92" cy="78" r="13" fill="#f8fafc" />
                <line x1="102" y1="88" x2="124" y2="116" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="122" y1="116" x2="156" y2="120" stroke="#00d4aa" stroke-width="8" stroke-linecap="round" />
                <line x1="122" y1="116" x2="100" y2="150" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="100" y1="150" x2="92" y2="184" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="122" y1="116" x2="142" y2="154" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="142" y1="154" x2="152" y2="184" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="112" y1="100" x2="84" y2="130" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
            `,
        }),
        createFrame({
            title: 'BURPEES',
            cue: 'Explode up with hands overhead',
            step: 2,
            accent: '#f59e0b',
            body: `
                ${commonBody.floor}
                <circle cx="120" cy="60" r="13" fill="#f8fafc" />
                <line x1="120" y1="74" x2="120" y2="128" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="120" y1="88" x2="94" y2="50" stroke="#00d4aa" stroke-width="8" stroke-linecap="round" />
                <line x1="120" y1="88" x2="146" y2="50" stroke="#00d4aa" stroke-width="8" stroke-linecap="round" />
                <line x1="120" y1="128" x2="102" y2="174" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="120" y1="128" x2="138" y2="174" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
            `,
        }),
    ],
    custom_battle_ropes: [
        createFrame({
            title: 'BATTLE ROPES',
            cue: 'Athletic stance, ropes low',
            step: 1,
            accent: '#ef4444',
            body: `
                ${commonBody.floor}
                <circle cx="104" cy="64" r="13" fill="#f8fafc" />
                <line x1="104" y1="78" x2="116" y2="126" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="112" y1="94" x2="82" y2="122" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="116" y1="94" x2="158" y2="118" stroke="#00d4aa" stroke-width="8" stroke-linecap="round" />
                <line x1="116" y1="126" x2="98" y2="182" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="116" y1="126" x2="136" y2="182" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <path d="M158 118 C176 118 182 124 194 126 C206 128 210 124 214 116" fill="none" stroke="#ef4444" stroke-width="7" stroke-linecap="round" />
                <path d="M82 122 C58 126 46 134 34 140" fill="none" stroke="#ef4444" stroke-width="7" stroke-linecap="round" opacity="0.75" />
            `,
        }),
        createFrame({
            title: 'BATTLE ROPES',
            cue: 'Snap ropes up and forward',
            step: 2,
            accent: '#ef4444',
            body: `
                ${commonBody.floor}
                <circle cx="104" cy="64" r="13" fill="#f8fafc" />
                <line x1="104" y1="78" x2="116" y2="126" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="112" y1="92" x2="86" y2="72" stroke="#00d4aa" stroke-width="8" stroke-linecap="round" />
                <line x1="116" y1="92" x2="156" y2="82" stroke="#00d4aa" stroke-width="8" stroke-linecap="round" />
                <line x1="116" y1="126" x2="98" y2="182" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="116" y1="126" x2="136" y2="182" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <path d="M156 82 C176 70 190 64 214 72" fill="none" stroke="#ef4444" stroke-width="7" stroke-linecap="round" />
                <path d="M86 72 C64 58 50 56 30 64" fill="none" stroke="#ef4444" stroke-width="7" stroke-linecap="round" opacity="0.75" />
            `,
        }),
    ],
    custom_jumping_jacks: [
        createFrame({
            title: 'JUMPING JACKS',
            cue: 'Feet together, arms down',
            step: 1,
            accent: '#f59e0b',
            body: `
                ${commonBody.floor}
                <circle cx="120" cy="58" r="14" fill="#f8fafc" />
                <line x1="120" y1="74" x2="120" y2="128" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="120" y1="90" x2="96" y2="116" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="120" y1="90" x2="144" y2="116" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="120" y1="128" x2="108" y2="182" stroke="#00d4aa" stroke-width="8" stroke-linecap="round" />
                <line x1="120" y1="128" x2="132" y2="182" stroke="#00d4aa" stroke-width="8" stroke-linecap="round" />
            `,
        }),
        createFrame({
            title: 'JUMPING JACKS',
            cue: 'Jump wide and reach overhead',
            step: 2,
            accent: '#f59e0b',
            body: `
                ${commonBody.floor}
                <circle cx="120" cy="58" r="14" fill="#f8fafc" />
                <line x1="120" y1="74" x2="120" y2="128" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="120" y1="88" x2="92" y2="42" stroke="#00d4aa" stroke-width="8" stroke-linecap="round" />
                <line x1="120" y1="88" x2="148" y2="42" stroke="#00d4aa" stroke-width="8" stroke-linecap="round" />
                <line x1="120" y1="128" x2="90" y2="182" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
                <line x1="120" y1="128" x2="150" y2="182" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
            `,
        }),
    ],
}

export const hasCustomExerciseMedia = imageId => Boolean(CUSTOM_EXERCISE_MEDIA[imageId])

export const getCustomExerciseImage = (imageId, frame = 0) => {
    const frames = CUSTOM_EXERCISE_MEDIA[imageId]
    if (!frames) return null
    return frames[Math.min(frame, frames.length - 1)] || null
}

export const getCustomExerciseFrameAvailability = (imageId, frame = 1) => {
    const frames = CUSTOM_EXERCISE_MEDIA[imageId]
    if (!frames) return null
    return Boolean(frames[frame])
}
