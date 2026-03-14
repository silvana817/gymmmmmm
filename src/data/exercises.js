import { getCustomExerciseFrameAvailability, getCustomExerciseImage, hasCustomExerciseMedia } from './customExerciseMedia'
import { appConfig } from '../config/app'

// 180+ exercises with free-exercise-db image IDs.
// Hosted via jsDelivr's GitHub CDN for lower latency and better cache behavior.

const IMG_BASE = appConfig.exerciseMediaBaseUrl.replace(/\/$/, '')
const frameAvailabilityCache = new Map()
const pendingFrameChecks = new Map()

export const getExerciseImage = (imageId, frame = 0) => {
    if (!imageId) return null
    if (hasCustomExerciseMedia(imageId)) {
        return getCustomExerciseImage(imageId, frame)
    }
    return `${IMG_BASE}/${encodeURIComponent(imageId)}/${frame}.jpg`
}

export const getExerciseFrameAvailability = (imageId, frame = 1) => {
    if (!imageId) return null
    if (hasCustomExerciseMedia(imageId)) {
        return getCustomExerciseFrameAvailability(imageId, frame)
    }
    return frameAvailabilityCache.get(`${imageId}:${frame}`) ?? null
}

function probeFrameByImage(url) {
    return new Promise(resolve => {
        const probe = new Image()
        const finish = result => {
            probe.onload = null
            probe.onerror = null
            resolve(result)
        }

        probe.onload = () => finish(true)
        probe.onerror = () => finish(false)
        probe.decoding = 'async'
        probe.src = url
    })
}

export async function hasExerciseFrame(imageId, frame = 1) {
    if (!imageId) {
        return false
    }

    if (hasCustomExerciseMedia(imageId)) {
        return Boolean(getCustomExerciseFrameAvailability(imageId, frame))
    }

    const key = `${imageId}:${frame}`
    const cached = frameAvailabilityCache.get(key)
    if (cached !== undefined) {
        return cached
    }

    const pending = pendingFrameChecks.get(key)
    if (pending) {
        return pending
    }

    const url = getExerciseImage(imageId, frame)
    const request = (async () => {
        let result = false

        if (typeof fetch === 'function') {
            try {
                const response = await fetch(url, { method: 'HEAD', mode: 'cors' })
                result = response.ok
            } catch {
                result = typeof Image !== 'undefined' ? await probeFrameByImage(url) : false
            }
        } else if (typeof Image !== 'undefined') {
            result = await probeFrameByImage(url)
        }

        frameAvailabilityCache.set(key, result)
        pendingFrameChecks.delete(key)
        return result
    })()

    pendingFrameChecks.set(key, request)
    return request
}

export const EXERCISES = [
    // ---------------------------------------
    // PECHO (22)
    // ---------------------------------------
    { id: 'ex1', nombre: 'Press de Banca', grupo: 'Pecho', descripcion: 'Acostado en banco plano, baja la barra al pecho y empuja.', imageId: 'Barbell_Bench_Press_-_Medium_Grip' },
    { id: 'ex2', nombre: 'Press Inclinado con Barra', grupo: 'Pecho', descripcion: 'En banco inclinado a 30-45°, empuja la barra desde el pecho.', imageId: 'Barbell_Incline_Bench_Press_-_Medium_Grip' },
    { id: 'ex3', nombre: 'Press Declinado con Barra', grupo: 'Pecho', descripcion: 'En banco declinado, baja la barra al pecho bajo y empuja.', imageId: 'Decline_Barbell_Bench_Press' },
    { id: 'ex4', nombre: 'Press con Mancuernas', grupo: 'Pecho', descripcion: 'Acostado con mancuernas, empuja hacia arriba uniendo las manos.', imageId: 'Dumbbell_Bench_Press' },
    { id: 'ex5', nombre: 'Aperturas con Mancuernas', grupo: 'Pecho', descripcion: 'Abre los brazos en banco plano con mancuernas.', imageId: 'Dumbbell_Flyes' },
    { id: 'ex6', nombre: 'Aperturas Inclinado', grupo: 'Pecho', descripcion: 'Aperturas en banco inclinado para pecho superior.', imageId: 'Incline_Dumbbell_Flyes' },
    { id: 'ex7', nombre: 'Fondos en Paralelas', grupo: 'Pecho', descripcion: 'Baja el cuerpo entre barras flexionando los codos, inclinado.', imageId: 'Dips_-_Chest_Version' },
    { id: 'ex8', nombre: 'Crossover en Polea', grupo: 'Pecho', descripcion: 'De pie entre poleas, cruza los cables frente al pecho.', imageId: 'Cable_Crossover' },
    { id: 'ex9', nombre: 'Pullover con Mancuerna', grupo: 'Pecho', descripcion: 'Acostado transversal, lleva la mancuerna detrás de la cabeza.', imageId: 'Bent-Arm_Dumbbell_Pullover' },
    { id: 'ex10', nombre: 'Press en Máquina', grupo: 'Pecho', descripcion: 'Empuja los agarres de la máquina sentado con pecho abierto.', imageId: 'Machine_Bench_Press' },
    { id: 'ex11', nombre: 'Flexiones de Brazo', grupo: 'Pecho', descripcion: 'Desde el suelo, empuja el cuerpo con los brazos.', imageId: 'Pushups' },
    { id: 'ex12', nombre: 'Contractor (Pec Deck)', grupo: 'Pecho', descripcion: 'En máquina, junta los brazos frente al pecho.', imageId: 'Butterfly' },
    { id: 'ex13', nombre: 'Press Inclinado Mancuernas', grupo: 'Pecho', descripcion: 'Empuja mancuernas en banco inclinado para pecho superior.', imageId: 'Incline_Dumbbell_Press' },
    { id: 'ex13c', nombre: 'Flexiones Declinadas', grupo: 'Pecho', descripcion: 'Flexiones con los pies elevados en un banco.', imageId: 'Decline_Push-Up' },
    { id: 'ex13d', nombre: 'Press Declinado Mancuernas', grupo: 'Pecho', descripcion: 'Press con mancuernas en banco declinado.', imageId: 'Decline_Dumbbell_Bench_Press' },
    { id: 'ex13e', nombre: 'Flexiones Diamante', grupo: 'Pecho', descripcion: 'Flexiones con manos juntas formando un diamante bajo el pecho.', imageId: 'Push-Ups_-_Close_Triceps_Position' },
    { id: 'ex13f', nombre: 'Svend Press', grupo: 'Pecho', descripcion: 'De pie, aprieta dos discos y empújalos hacia adelante.', imageId: 'Svend_Press' },
    { id: 'ex13g', nombre: 'Hex Press', grupo: 'Pecho', descripcion: 'Press con mancuernas apretándolas juntas permanentemente.', imageId: 'Close-Grip_Dumbbell_Press' },
    { id: 'ex13h', nombre: 'Aperturas en Polea Baja', grupo: 'Pecho', descripcion: 'Aperturas con poleas desde abajo hacia arriba (pecho superior).', imageId: 'Low_Cable_Crossover' },
    { id: 'ex13i', nombre: 'Chest Press a una mano', grupo: 'Pecho', descripcion: 'Press unilateral en máquina o polea.', imageId: 'Single-Arm_Cable_Crossover' },
    { id: 'ex13j', nombre: 'Floor Press', grupo: 'Pecho', descripcion: 'Press de banca realizado desde el suelo.', imageId: 'Barbell_Bench_Press_-_Medium_Grip' },
    { id: 'ex13k', nombre: 'Pec Deck a una mano', grupo: 'Pecho', descripcion: 'Contracciones unilaterales en máquina pec deck.', imageId: 'Butterfly' },

    // ---------------------------------------
    // ESPALDA (24)
    // ---------------------------------------
    { id: 'ex14', nombre: 'Dominadas', grupo: 'Espalda', descripcion: 'Colgado de la barra, sube hasta que la barbilla pase la barra.', imageId: 'Pullups' },
    { id: 'ex15', nombre: 'Dominadas Agarre Cerrado', grupo: 'Espalda', descripcion: 'Dominadas cortas, énfasis en dorsales bajos y bíceps.', imageId: 'Close-Grip_Front_Lat_Pulldown' },
    { id: 'ex16', nombre: 'Remo con Barra', grupo: 'Espalda', descripcion: 'Inclinado a 45°, lleva la barra hacia el abdomen bajo.', imageId: 'Bent_Over_Barbell_Row' },
    { id: 'ex17', nombre: 'Remo con Mancuerna', grupo: 'Espalda', descripcion: 'Con una mano en banco, rema la mancuerna hacia la cadera.', imageId: 'One-Arm_Dumbbell_Row' },
    { id: 'ex18', nombre: 'Jalón al Pecho', grupo: 'Espalda', descripcion: 'En polea alta, tira la barra hacia el pecho con codos abajo.', imageId: 'Wide-Grip_Lat_Pulldown' },
    { id: 'ex19', nombre: 'Jalón Agarre Cerrado', grupo: 'Espalda', descripcion: 'Jalón con agarre cerrado V para espalda media.', imageId: 'Underhand_Cable_Pulldowns' },
    { id: 'ex20', nombre: 'Remo en Polea Baja', grupo: 'Espalda', descripcion: 'Sentado, tira el agarre hacia el abdomen con espalda recta.', imageId: 'Seated_Cable_Rows' },
    { id: 'ex21', nombre: 'Peso Muerto', grupo: 'Espalda', descripcion: 'Levanta la barra desde el suelo con cadena posterior recta.', imageId: 'Barbell_Deadlift' },
    { id: 'ex22', nombre: 'Peso Muerto Rumano', grupo: 'Espalda', descripcion: 'Con piernas semi-extendidas, baja la barra por los muslos.', imageId: 'Romanian_Deadlift' },
    { id: 'ex23', nombre: 'Remo T-Bar', grupo: 'Espalda', descripcion: 'Remo con barra en landmine para espalda media y baja.', imageId: 'T-Bar_Row_with_Handle' },
    { id: 'ex24', nombre: 'Pull-Over en Polea', grupo: 'Espalda', descripcion: 'En polea alta, tira la barra recta hacia los muslos.', imageId: 'Straight-Arm_Dumbbell_Pullover' },
    { id: 'ex25', nombre: 'Encogimientos con Barra', grupo: 'Espalda', descripcion: 'Eleva los hombros con barra para trabajar trapecios.', imageId: 'Barbell_Shrug' },
    { id: 'ex25b', nombre: 'Remo en Máquina', grupo: 'Espalda', descripcion: 'Remo sentado en máquina para espalda media.', imageId: 'Seated_Cable_Rows' },
    { id: 'ex25c', nombre: 'Hiperextensiones', grupo: 'Espalda', descripcion: 'En banco de hiperextensiones, extiende el torso desde cadera.', imageId: 'Hyperextensions_Back_Extensions' },
    { id: 'ex25d', nombre: 'Remo Pendlay', grupo: 'Espalda', descripcion: 'Remo con barra desde el piso en cada rep, torso paralelo.', imageId: 'Bent_Over_Barbell_Row' },
    { id: 'ex25e', nombre: 'Jalón tras Nuca', grupo: 'Espalda', descripcion: 'Jalón en polea alta llevando la barra detrás de la cabeza.', imageId: 'Wide-Grip_Lat_Pulldown' },
    { id: 'ex25f', nombre: 'Kroc Row', grupo: 'Espalda', descripcion: 'Remo con mancuerna pesado y a altas repeticiones.', imageId: 'One-Arm_Dumbbell_Row' },
    { id: 'ex25g', nombre: 'Meadows Row', grupo: 'Espalda', descripcion: 'Remo unilateral usando un landmine, agarre grueso recomendado.', imageId: 'Bent_Over_One-Arm_Long_Bar_Row' },
    { id: 'ex25h', nombre: 'Rack Pulls', grupo: 'Espalda', descripcion: 'Peso muerto parcial arrancando desde los seguros del rack.', imageId: 'Rack_Pull_with_Bands' },
    { id: 'ex25i', nombre: 'Remo Invertido', grupo: 'Espalda', descripcion: 'Colgado bajo una barra fija, jalar el cuerpo hacia ella.', imageId: 'Inverted_Row' },
    { id: 'ex25j', nombre: 'Chin Ups', grupo: 'Espalda', descripcion: 'Dominadas con agarre supino (palmas hacia vos).', imageId: 'Chin-Up' },
    { id: 'ex25k', nombre: 'Pec Deck Invertido', grupo: 'Espalda', descripcion: 'Aperturas inversas en máquina para deltoides posterior.', imageId: 'Reverse_Machine_Flyes' },
    { id: 'ex25l', nombre: 'Jalón Unilateral en Polea', grupo: 'Espalda', descripcion: 'Jalón en polea alta a una sola mano.', imageId: 'Wide-Grip_Lat_Pulldown' },
    { id: 'ex25m', nombre: 'Superman Hold', grupo: 'Espalda', descripcion: 'Boca abajo en el suelo, eleva brazos y piernas simultáneamente.', imageId: 'Superman' },

    // ---------------------------------------
    // PIERNAS (25)
    // ---------------------------------------
    { id: 'ex26', nombre: 'Sentadilla con Barra', grupo: 'Piernas', descripcion: 'Desciende con la barra en los hombros hasta los 90° o más.', imageId: 'Barbell_Full_Squat' },
    { id: 'ex27', nombre: 'Sentadilla Frontal', grupo: 'Piernas', descripcion: 'Barra apoyada en deltoides anteriores, torso vertical.', imageId: 'Front_Barbell_Squat' },
    { id: 'ex28', nombre: 'Sentadilla Búlgara', grupo: 'Piernas', descripcion: 'Pie trasero en banco, baja en una pierna con mancuernas.', imageId: 'Split_Squat_with_Dumbbells' },
    { id: 'ex29', nombre: 'Prensa de Piernas', grupo: 'Piernas', descripcion: 'Empuja la plataforma con los pies hasta extender.', imageId: 'Leg_Press' },
    { id: 'ex30', nombre: 'Prensa 45°', grupo: 'Piernas', descripcion: 'Empuja la plataforma inclinada con diferentes posiciones de pies.', imageId: 'Leg_Press' },
    { id: 'ex31', nombre: 'Extensión de Cuádriceps', grupo: 'Piernas', descripcion: 'En máquina, extiende las piernas contra la resistencia.', imageId: 'Leg_Extensions' },
    { id: 'ex32', nombre: 'Curl Femoral Acostado', grupo: 'Piernas', descripcion: 'Boca abajo, flexiona las piernas contra la resistencia.', imageId: 'Lying_Leg_Curls' },
    { id: 'ex33', nombre: 'Curl Femoral Sentado', grupo: 'Piernas', descripcion: 'Sentado, flexiona las piernas hacia abajo.', imageId: 'Seated_Leg_Curl' },
    { id: 'ex34', nombre: 'Zancadas con Mancuernas', grupo: 'Piernas', descripcion: 'Da un paso adelante y baja la rodilla trasera al suelo.', imageId: 'Dumbbell_Lunges' },
    { id: 'ex35', nombre: 'Zancadas Caminando', grupo: 'Piernas', descripcion: 'Zancadas continuas caminando con mancuernas.', imageId: 'Dumbbell_Lunges' },
    { id: 'ex36', nombre: 'Elevación de Talones de Pie', grupo: 'Piernas', descripcion: 'En máquina o Smith, sube en puntas de pie.', imageId: 'Standing_Calf_Raises' },
    { id: 'ex37', nombre: 'Elevación de Talones Sentado', grupo: 'Piernas', descripcion: 'Sentado con peso en rodillas, sube en puntas.', imageId: 'Seated_Calf_Raise' },
    { id: 'ex38', nombre: 'Sentadilla Hack', grupo: 'Piernas', descripcion: 'En máquina hack, desciende con espalda apoyada.', imageId: 'Hack_Squat' },
    { id: 'ex39', nombre: 'Step Up con Mancuernas', grupo: 'Piernas', descripcion: 'Sube a un cajón con una pierna sosteniendo mancuernas.', imageId: 'Dumbbell_Step_Ups' },
    { id: 'ex39b', nombre: 'Sentadilla Goblet', grupo: 'Piernas', descripcion: 'Sentadilla sosteniendo mancuerna o kettlebell al pecho.', imageId: 'Goblet_Squat' },
    { id: 'ex39c', nombre: 'Peso Muerto Sumo', grupo: 'Piernas', descripcion: 'Peso muerto con stance amplio, cuádriceps y aductores.', imageId: 'Sumo_Deadlift' },
    { id: 'ex39d', nombre: 'Sentadilla Sissy', grupo: 'Piernas', descripcion: 'Flexión profunda de rodillas inclinando hacia atrás para cuadas.', imageId: 'Barbell_Full_Squat' },
    { id: 'ex39e', nombre: 'Prensa Pantorrillas', grupo: 'Piernas', descripcion: 'En máquina de prensa, empuja con las puntas de los pies.', imageId: 'Calf_Press_On_The_Leg_Press_Machine' },
    { id: 'ex39f', nombre: 'Pistol Squat', grupo: 'Piernas', descripcion: 'Sentadilla a una sola pierna libre.', imageId: 'Kettlebell_Pistol_Squat' },
    { id: 'ex39g', nombre: 'Glute Ham Raise (GHR)', grupo: 'Piernas', descripcion: 'Flexión de isquios en máquina GHR con peso corporal.', imageId: 'Glute_Ham_Raise' },
    { id: 'ex39h', nombre: 'Aductores en Máquina', grupo: 'Piernas', descripcion: 'Sentado, junta las piernas contra la resistencia.', imageId: 'Thigh_Adductor' },
    { id: 'ex39i', nombre: 'Nordic Hamstring Curl', grupo: 'Piernas', descripcion: 'Sujetando talones, baja el torso controlado y empuja.', imageId: 'Natural_Glute_Ham_Raise' },
    { id: 'ex39j', nombre: 'Reverse Nordic', grupo: 'Piernas', descripcion: 'De rodillas, inclinate hacia atrás estirando cuádriceps al máximo.', imageId: 'custom_reverse_nordic' },
    { id: 'ex39k', nombre: 'Curl Femoral con Mancuerna', grupo: 'Piernas', descripcion: 'Acostado boca abajo, sosteniendo una mancuerna entre los pies.', imageId: 'Lying_Leg_Curls' },
    { id: 'ex39l', nombre: 'Elevaciones Talón a una Pierna', grupo: 'Piernas', descripcion: 'Parado en un disco, elevación de gemelo unilateral.', imageId: 'Standing_Calf_Raises' },

    // ---------------------------------------
    // HOMBROS (18)
    // ---------------------------------------
    { id: 'ex40', nombre: 'Press Militar con Barra', grupo: 'Hombros', descripcion: 'De pie, empuja la barra desde los hombros hacia arriba.', imageId: 'Standing_Military_Press' },
    { id: 'ex41', nombre: 'Press Arnold', grupo: 'Hombros', descripcion: 'Press con mancuernas rotando las muñecas durante el movimiento.', imageId: 'Arnold_Dumbbell_Press' },
    { id: 'ex42', nombre: 'Press con Mancuernas Sentado', grupo: 'Hombros', descripcion: 'Sentado, empuja mancuernas hacia arriba.', imageId: 'Seated_Dumbbell_Press' },
    { id: 'ex43', nombre: 'Elevaciones Laterales', grupo: 'Hombros', descripcion: 'Levanta mancuernas a los lados hasta la altura de los hombros.', imageId: 'Side_Lateral_Raise' },
    { id: 'ex44', nombre: 'Elevaciones Frontales', grupo: 'Hombros', descripcion: 'Levanta mancuernas al frente hasta los hombros.', imageId: 'Front_Dumbbell_Raise' },
    { id: 'ex45', nombre: 'Pájaros (Elevación Posterior)', grupo: 'Hombros', descripcion: 'Inclinado, levanta mancuernas para deltoides posterior.', imageId: 'Seated_Bent-Over_Rear_Delt_Raise' },
    { id: 'ex46', nombre: 'Face Pull', grupo: 'Hombros', descripcion: 'En polea alta, tira la cuerda hacia la cara con codos arriba.', imageId: 'Face_Pull' },
    { id: 'ex47', nombre: 'Remo al Mentón', grupo: 'Hombros', descripcion: 'Con barra, sube hasta el mentón con codos arriba.', imageId: 'Upright_Barbell_Row' },
    { id: 'ex48', nombre: 'Elevación Lateral en Polea', grupo: 'Hombros', descripcion: 'Elevación lateral con polea baja para tensión constante.', imageId: 'Side_Lateral_Raise' },
    { id: 'ex49', nombre: 'Press en Máquina', grupo: 'Hombros', descripcion: 'Sentado en máquina, empuja los agarres hacia arriba.', imageId: 'Machine_Shoulder_Military_Press' },
    { id: 'ex49b', nombre: 'Encogimientos con Mancuernas', grupo: 'Hombros', descripcion: 'Eleva los hombros con mancuernas para trapecios.', imageId: 'Dumbbell_Shrug' },
    { id: 'ex49c', nombre: 'Press Militar Sentado', grupo: 'Hombros', descripcion: 'Sentado, empuja barra por encima de la cabeza.', imageId: 'Seated_Barbell_Military_Press' },
    { id: 'ex49d', nombre: 'W Raises', grupo: 'Hombros', descripcion: 'Boca abajo en banco inclinado, levanta mancuernas formando W.', imageId: 'Seated_Bent-Over_Rear_Delt_Raise' },
    { id: 'ex49e', nombre: 'Lu Raises', grupo: 'Hombros', descripcion: 'Elevación frontal + lateral combinada con mancuernas ligeras.', imageId: 'Front_Dumbbell_Raise' },
    { id: 'ex49f', nombre: 'Landmine Press', grupo: 'Hombros', descripcion: 'Empuje de hombro unilateral usando la barra en landmine.', imageId: 'Landmine_Linear_Jammer' },
    { id: 'ex49g', nombre: 'Z Press', grupo: 'Hombros', descripcion: 'Press militar sentado en el suelo con las piernas rectas.', imageId: 'Seated_Barbell_Military_Press' },
    { id: 'ex49h', nombre: 'Bradford Press', grupo: 'Hombros', descripcion: 'Press de barra llevando alternativamente la barra adelante y atrás del cuello.', imageId: 'Standing_Military_Press' },
    { id: 'ex49i', nombre: 'Press Cubano', grupo: 'Hombros', descripcion: 'Combinación de remo al mentón, rotación externa y press militar.', imageId: 'Cuban_Press' },

    // ---------------------------------------
    // BRAZOS (26)
    // ---------------------------------------
    { id: 'ex50', nombre: 'Curl Bíceps con Barra', grupo: 'Brazos', descripcion: 'De pie, flexiona los codos subiendo la barra recta.', imageId: 'Barbell_Curl' },
    { id: 'ex51', nombre: 'Curl Bíceps con Mancuernas', grupo: 'Brazos', descripcion: 'Flexiona alternando o simultáneamente con mancuernas.', imageId: 'Dumbbell_Bicep_Curl' },
    { id: 'ex52', nombre: 'Curl Martillo', grupo: 'Brazos', descripcion: 'Curl con mancuernas en posición neutra para braquial.', imageId: 'Hammer_Curls' },
    { id: 'ex53', nombre: 'Curl en Banco Scott', grupo: 'Brazos', descripcion: 'Apoyando los brazos en el banco Scott, curl con barra EZ.', imageId: 'Preacher_Curl' },
    { id: 'ex54', nombre: 'Curl Concentrado', grupo: 'Brazos', descripcion: 'Sentado, con codo en el muslo, curl con mancuerna.', imageId: 'Concentration_Curls' },
    { id: 'ex55', nombre: 'Curl en Polea Baja', grupo: 'Brazos', descripcion: 'De pie frente a la polea, curl con cuerda o barra recta.', imageId: 'Cable_Hammer_Curls_-_Rope_Attachment' },
    { id: 'ex56', nombre: 'Tríceps en Polea (Pushdown)', grupo: 'Brazos', descripcion: 'En polea alta, extiende los codos hacia abajo.', imageId: 'Triceps_Pushdown' },
    { id: 'ex57', nombre: 'Tríceps con Cuerda', grupo: 'Brazos', descripcion: 'Pushdown con cuerda, abriendo al final del movimiento.', imageId: 'Triceps_Pushdown_-_Rope_Attachment' },
    { id: 'ex58', nombre: 'Extensión Tríceps Overhead', grupo: 'Brazos', descripcion: 'Con mancuerna sobre la cabeza, extiende los codos.', imageId: 'Standing_Dumbbell_Triceps_Extension' },
    { id: 'ex59', nombre: 'Press Francés', grupo: 'Brazos', descripcion: 'Acostado, baja la barra EZ a la frente y extiende.', imageId: 'EZ-Bar_Skullcrusher' },
    { id: 'ex60', nombre: 'Fondos en Banco', grupo: 'Brazos', descripcion: 'Manos en banco atrás, baja el cuerpo flexionando codos.', imageId: 'Bench_Dips' },
    { id: 'ex61', nombre: 'Patada de Tríceps', grupo: 'Brazos', descripcion: 'Inclinado, extiende el codo hacia atrás con mancuerna.', imageId: 'Tricep_Dumbbell_Kickback' },
    { id: 'ex62', nombre: 'Curl con Barra EZ', grupo: 'Brazos', descripcion: 'Curl con barra EZ para menor estrés en muñecas.', imageId: 'Barbell_Curl' },
    { id: 'ex63', nombre: 'Curl Araña', grupo: 'Brazos', descripcion: 'Apoyado boca abajo en banco inclinado, curl con mancuernas o barra.', imageId: 'Concentration_Curls' },
    { id: 'ex63b', nombre: 'Press Cerrado', grupo: 'Brazos', descripcion: 'Press de banca con agarre cerrado enfocado en tríceps.', imageId: 'Close-Grip_Barbell_Bench_Press' },
    { id: 'ex63c', nombre: 'Curl Inclinado', grupo: 'Brazos', descripcion: 'Curl con mancuernas en banco inclinado a 45°.', imageId: 'Dumbbell_Bicep_Curl' },
    { id: 'ex63d', nombre: 'Curl de Muñeca', grupo: 'Brazos', descripcion: 'Sentado, flexiona la muñeca con barra hacia arriba.', imageId: 'Palms-Up_Barbell_Wrist_Curl_Over_A_Bench' },
    { id: 'ex63e', nombre: 'Extensión de Muñeca', grupo: 'Brazos', descripcion: 'Sentado, extiende la muñeca con barra palmas abajo.', imageId: 'Palms-Down_Wrist_Curl_Over_A_Bench' },
    { id: 'ex63f', nombre: 'Curl Invertido', grupo: 'Brazos', descripcion: 'Curl de bíceps con palmas hacia el suelo (prono).', imageId: 'Barbell_Curl' },
    { id: 'ex63g', nombre: 'Curl Zottman', grupo: 'Brazos', descripcion: 'Sube en supinación, rota muñecas y baja en pronación.', imageId: 'Dumbbell_Bicep_Curl' },
    { id: 'ex63h', nombre: 'Curl 21', grupo: 'Brazos', descripcion: '7 reps mitad inferior, 7 superior, y 7 reps completas.', imageId: 'Barbell_Curl' },
    { id: 'ex63i', nombre: 'JM Press', grupo: 'Brazos', descripcion: 'Híbrido de press cerrado y rompecráneos con barra.', imageId: 'Close-Grip_Barbell_Bench_Press' },
    { id: 'ex63j', nombre: 'Tate Press', grupo: 'Brazos', descripcion: 'Press de tríceps con mancuernas bajando hacia el centro del pecho.', imageId: 'EZ-Bar_Skullcrusher' },
    { id: 'ex63k', nombre: 'Curl Drag', grupo: 'Brazos', descripcion: 'Subir la barra arrastrándola por el cuerpo, llevando codos atrás.', imageId: 'Barbell_Curl' },
    { id: 'ex63l', nombre: 'Tríceps Overhead en Polea', grupo: 'Brazos', descripcion: 'Extensión overhead de espaldas a la polea baja/media.', imageId: 'Triceps_Pushdown' },

    // ---------------------------------------
    // CORE (19)
    // ---------------------------------------
    { id: 'ex64', nombre: 'Plancha Frontal', grupo: 'Core', descripcion: 'Posición de plancha apoyado en antebrazos, cuerpo recto.', imageId: 'Plank' },
    { id: 'ex65', nombre: 'Plancha Lateral', grupo: 'Core', descripcion: 'Apoyado en un antebrazo de costado, mantener cadera elevada.', imageId: 'Side_Bridge' },
    { id: 'ex66', nombre: 'Crunch Abdominal', grupo: 'Core', descripcion: 'Acostado, eleva el torso contrayendo el abdomen.', imageId: 'Crunches' },
    { id: 'ex67', nombre: 'Crunch Inverso', grupo: 'Core', descripcion: 'Acostado, lleva las rodillas al pecho elevando la cadera.', imageId: 'Reverse_Crunch' },
    { id: 'ex68', nombre: 'Elevación de Piernas Colgando', grupo: 'Core', descripcion: 'Colgado de la barra, eleva las piernas rectas.', imageId: 'Hanging_Leg_Raise' },
    { id: 'ex69', nombre: 'Russian Twist', grupo: 'Core', descripcion: 'Sentado con torso inclinado, rota de lado a lado con peso.', imageId: 'Russian_Twist' },
    { id: 'ex70', nombre: 'Ab Wheel (Rueda Abdominal)', grupo: 'Core', descripcion: 'De rodillas, extiende el cuerpo con la rueda y vuelve.', imageId: 'Ab_Roller' },
    { id: 'ex71', nombre: 'Mountain Climbers', grupo: 'Core', descripcion: 'En posición de plancha, alterna rodillas al pecho rápidamente.', imageId: 'Mountain_Climbers' },
    { id: 'ex72', nombre: 'Bicycle Crunch', grupo: 'Core', descripcion: 'Acostado, simula pedalear tocando codo con rodilla opuesta.', imageId: 'Air_Bike' },
    { id: 'ex73', nombre: 'Dead Bug', grupo: 'Core', descripcion: 'Acostado boca arriba, extiende brazo y pierna opuesta coordinado.', imageId: 'Dead_Bug' },
    { id: 'ex73b', nombre: 'Crunch en Polea', grupo: 'Core', descripcion: 'De rodillas frente a la polea, flexiona el tronco con cuerda.', imageId: 'Cable_Crunch' },
    { id: 'ex73c', nombre: 'Rodillas al Pecho en Paralelas', grupo: 'Core', descripcion: 'Soportado, lleva rodillas al pecho flexionando.', imageId: 'Knee_Hip_Raise_On_Parallel_Bars' },
    { id: 'ex73d', nombre: 'Tocarse las Puntas de los Pies', grupo: 'Core', descripcion: 'Acostado, eleva piernas y tronco para tocar las puntas.', imageId: 'Crunches' },
    { id: 'ex73e', nombre: 'Pallof Press', grupo: 'Core', descripcion: 'De pie, extiende los brazos frente al pecho resistiendo rotación.', imageId: 'Pallof_Press' },
    { id: 'ex73f', nombre: 'L-Sit', grupo: 'Core', descripcion: 'Apoyado en paralelas o suelo, piernas horizontales formando una L.', imageId: 'custom_l_sit' },
    { id: 'ex73g', nombre: 'Dragon Flag', grupo: 'Core', descripcion: 'Acostado en banco, eleva torso y piernas rectos.', imageId: 'Reverse_Crunch' },
    { id: 'ex73h', nombre: 'Woodchoppers en Polea', grupo: 'Core', descripcion: 'Rotación explosiva diagonal jalando de arriba abajo o viceversa.', imageId: 'Standing_Cable_Wood_Chop' },
    { id: 'ex73i', nombre: 'Hollow Body Hold', grupo: 'Core', descripcion: 'Posición isométrica con lumbares al suelo, piernas y torso elevados.', imageId: 'Crunches' },
    { id: 'ex73j', nombre: 'Plancha con peso', grupo: 'Core', descripcion: 'Plancha frontal con un disco en la espalda media/baja.', imageId: 'Plank' },

    // ---------------------------------------
    // GLÚTEOS (16)
    // ---------------------------------------
    { id: 'ex74', nombre: 'Hip Thrust con Barra', grupo: 'Glúteos', descripcion: 'Apoyado en banco, eleva la cadera con barra sobre la pelvis.', imageId: 'Barbell_Hip_Thrust' },
    { id: 'ex75', nombre: 'Puente de Glúteos', grupo: 'Glúteos', descripcion: 'Acostado en suelo, eleva la cadera contrayendo glúteos.', imageId: 'Barbell_Hip_Thrust' },
    { id: 'ex76', nombre: 'Sentadilla Sumo', grupo: 'Glúteos', descripcion: 'Sentadilla con piernas abiertas y puntas hacia afuera.', imageId: 'Sumo_Deadlift' },
    { id: 'ex77', nombre: 'Patada en Máquina', grupo: 'Glúteos', descripcion: 'En máquina pertinente, empuja la plataforma hacia atrás.', imageId: 'Glute_Kickback' },
    { id: 'ex78', nombre: 'Abducción en Máquina', grupo: 'Glúteos', descripcion: 'Sentado, abre las piernas contra la resistencia.', imageId: 'Thigh_Abductor' },
    { id: 'ex79', nombre: 'Kickback en Polea', grupo: 'Glúteos', descripcion: 'Con tobillera en polea baja, extiende pierna hacia atrás.', imageId: 'Glute_Kickback' },
    { id: 'ex80', nombre: 'Buenos Días', grupo: 'Glúteos', descripcion: 'Con barra en hombros, inclínate manteniendo piernas semi-rectas.', imageId: 'Good_Morning' },
    { id: 'ex81', nombre: 'Peso Muerto a Una Pierna', grupo: 'Glúteos', descripcion: 'Peso muerto unilateral con mancuerna, equilibrio.', imageId: 'Romanian_Deadlift' },
    { id: 'ex82', nombre: 'Hip Thrust Unilateral', grupo: 'Glúteos', descripcion: 'Hip thrust apoyando una sola pierna.', imageId: 'Barbell_Hip_Thrust' },
    { id: 'ex83', nombre: 'Fire Hydrant', grupo: 'Glúteos', descripcion: 'En cuatro puntos, abre la pierna lateralmente manteniendo rodilla a 90°.', imageId: 'custom_fire_hydrant' },
    { id: 'ex83b', nombre: 'Donkey Kick', grupo: 'Glúteos', descripcion: 'En cuatro puntos, empuja la planta del pie hacia el techo.', imageId: 'Glute_Kickback' },
    { id: 'ex83c', nombre: 'Cable Pull-Through', grupo: 'Glúteos', descripcion: 'De espaldas a la polea baja, extiende cadera tirando el cable.', imageId: 'Pull_Through' },
    { id: 'ex83d', nombre: 'Abducción en Polea Baja', grupo: 'Glúteos', descripcion: 'De pie con tobillera, abre la pierna de lado contra polea.', imageId: 'Thigh_Abductor' },
    { id: 'ex83e', nombre: 'Curtsy Lunge', grupo: 'Glúteos', descripcion: 'Zancada cruzada hacia atrás (como reverencia), enfoca glúteo medio.', imageId: 'Dumbbell_Lunges' },
    { id: 'ex83f', nombre: 'Frog Pumps', grupo: 'Glúteos', descripcion: 'Puente de glúteos con las plantas de los pies juntas.', imageId: 'Barbell_Hip_Thrust' },
    { id: 'ex83g', nombre: 'Banded Lateral Walks', grupo: 'Glúteos', descripcion: 'Caminata lateral en media sentadilla con banda bajo rodillas.', imageId: 'Monster_Walk' },

    // ---------------------------------------
    // CARDIO / FUNCIONAL (14)
    // ---------------------------------------
    { id: 'ex84', nombre: 'Burpees', grupo: 'Cardio', descripcion: 'Flexión, salto y palmada arriba en un movimiento.', imageId: 'custom_burpees' },
    { id: 'ex85', nombre: 'Box Jumps', grupo: 'Cardio', descripcion: 'Salta sobre un cajón con ambos pies y baja controlado.', imageId: 'Box_Jump_Multiple_Response' },
    { id: 'ex86', nombre: 'Battle Ropes', grupo: 'Cardio', descripcion: 'Agita las cuerdas gruesas con movimientos alternados.', imageId: 'custom_battle_ropes' },
    { id: 'ex87', nombre: 'Kettlebell Swing', grupo: 'Cardio', descripcion: 'Balancea la kettlebell entre las piernas y arriba con cadera.', imageId: 'Kettlebell_Sumo_High_Pull' },
    { id: 'ex88', nombre: 'Thrusters', grupo: 'Cardio', descripcion: 'Sentadilla frontal + press de hombros en movimiento fluido.', imageId: 'Front_Barbell_Squat' },
    { id: 'ex89', nombre: 'Clean and Press', grupo: 'Cardio', descripcion: 'Levanta barra del suelo, reposa y presiona sobre la cabeza.', imageId: 'Clean_and_Press' },
    { id: 'ex90', nombre: 'Soga de Saltar', grupo: 'Cardio', descripcion: 'Salta la soga a ritmo constante o con dobles bajos.', imageId: 'Rope_Jumping' },
    { id: 'ex91', nombre: 'Remo en Ergómetro', grupo: 'Cardio', descripcion: 'En máquina de remo, empuja con piernas y tira espalda.', imageId: 'Rowing_Stationary' },
    { id: 'ex92', nombre: 'Bicicleta Estática', grupo: 'Cardio', descripcion: 'Pedaleo continuo sentado o de pie.', imageId: 'Bicycling_Stationary' },
    { id: 'ex93', nombre: 'Cinta de Correr', grupo: 'Cardio', descripcion: 'Caminata rápida o trote constante en cinta.', imageId: 'Jogging_Treadmill' },
    { id: 'ex94', nombre: 'Snatch con Barra', grupo: 'Cardio', descripcion: 'Levanta la barra del suelo hasta overhead en un solo movimiento.', imageId: 'Clean_and_Press' },
    { id: 'ex95', nombre: 'Jumping Jacks', grupo: 'Cardio', descripcion: 'Salta abriendo piernas y brazos simultáneamente.', imageId: 'custom_jumping_jacks' },
    { id: 'ex95b', nombre: 'Sprints', grupo: 'Cardio', descripcion: 'Corridas de máxima velocidad cortas con descansos largos.', imageId: 'Wind_Sprints' },
    { id: 'ex95c', nombre: 'Saltos al Cajón Una Pierna', grupo: 'Cardio', descripcion: 'Box jump unilateral para explosividad máxima.', imageId: 'Box_Jump_Multiple_Response' },

    // ---------------------------------------
    // STRETCHING (12)
    // ---------------------------------------
    { id: 'ex96', nombre: 'Estiramiento de Cuádriceps', grupo: 'Stretching', descripcion: 'De pie, lleva el talón al glúteo y sostené.', imageId: 'Kneeling_Hip_Flexor' },
    { id: 'ex97', nombre: 'Estiramiento de Isquiotibiales', grupo: 'Stretching', descripcion: 'Sentado o de pie con piernas rectas, toca las puntas de los pies.', imageId: '90_90_Hamstring' },
    { id: 'ex98', nombre: 'Estiramiento de Pectoral', grupo: 'Stretching', descripcion: 'Con el brazo en el marco de una puerta o rack, gira el torso.', imageId: 'Chest_And_Front_Of_Shoulder_Stretch' },
    { id: 'ex99', nombre: 'Estiramiento de Dorsal', grupo: 'Stretching', descripcion: 'Colgado relajado de la barra, o estirando en poste de rack.', imageId: 'Standing_Lateral_Stretch' },
    { id: 'ex100', nombre: 'Estiramiento de Hombro', grupo: 'Stretching', descripcion: 'Cruza un brazo horizontal por delante y presiona.', imageId: 'Shoulder_Stretch' },
    { id: 'ex101', nombre: 'Estiramiento de Tríceps', grupo: 'Stretching', descripcion: 'Lleva el codo por detrás de la nuca y presiona hacia abajo.', imageId: 'Triceps_Stretch' },
    { id: 'ex102', nombre: 'Estiramiento de Gemelos', grupo: 'Stretching', descripcion: 'Contra la pared, empuja talón de la pierna trasera al piso.', imageId: 'Calf_Stretch_Hands_Against_Wall' },
    { id: 'ex103', nombre: 'Estiramiento de Cadera', grupo: 'Stretching', descripcion: 'En posición de zancada estática, empuja la pelvis adelante.', imageId: 'Kneeling_Hip_Flexor' },
    { id: 'ex104', nombre: 'Estiramiento de Glúteos', grupo: 'Stretching', descripcion: 'Figura 4 cruzando rodilla al pecho.', imageId: 'IT_Band_and_Glute_Stretch' },
    { id: 'ex105', nombre: 'Cat-Cow (Movilidad Columna)', grupo: 'Stretching', descripcion: 'En cuatro puntos, redondear y arquear la columna fluidamente.', imageId: 'Cat_Stretch' },
    { id: 'ex106', nombre: 'Estiramiento Cuello', grupo: 'Stretching', descripcion: 'Tira levemente la cabeza lateralmente estirando trapecio alto.', imageId: 'Side_Neck_Stretch' },
    { id: 'ex107', nombre: 'Flexor de Cadera Profundo', grupo: 'Stretching', descripcion: 'Couch stretch: rodilla trasera en pared o banco, cadera al frente.', imageId: 'Kneeling_Hip_Flexor' },
]

export const MUSCLE_GROUPS = ['Todos', 'Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core', 'Glúteos', 'Cardio', 'Stretching']






