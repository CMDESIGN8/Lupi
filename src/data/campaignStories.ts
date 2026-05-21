// src/data/campaignStories.ts
export interface MatchStory {
  id: string;
  title: string;
  intro: string;
  opponentQuotes: {
    before: string;
    during?: string;
    after: string;
  };
  cinematics: {
    beforeMatch?: string;
    onGoal?: string;
    onWin?: string;
  };
  rivalSpecial: string;
  rewardMessage: string;
}

export const LEAGUE_STORIES: Record<string, MatchStory[]> = {
  rookie: [
    {
      id: 'rookie_1',
      title: '⭐ ¡EL PRIMER PARTIDO!',
      intro: 'Es tu debut en el fútbol profesional. El estadio está lleno de familias que vinieron a verte. Los nervios están presentes, pero tu sueño empieza hoy.',
      opponentQuotes: {
        before: '"Tranquilo, es solo un partido... pero te voy a mostrar cómo se juega" - Capitán rival',
        after: '"Bienvenido al fútbol! Tenés futuro, seguí así."'
      },
      cinematics: {
        beforeMatch: '📺 Las cámaras de TV te enfocan. Es tu momento.',
        onWin: '🎉 ¡Victoria histórica! La afición te ovaciona.'
      },
      rivalSpecial: 'El equipo rival tiene un delantero muy rápido',
      rewardMessage: '¡Primera victoria! Sentís que podés llegar lejos.'
    },
    {
      id: 'rookie_2',
      title: '⚡ LA REVANCHA',
      intro: 'El equipo contrario viene con sed de venganza. El técnico te dice: "Hoy demostramos quiénes somos". La presión está en tus hombros.',
      opponentQuotes: {
        before: '"La semana pasada fue suerte. Ahora veremos" - Rival frotándose las manos',
        during: '¡No te voy a dejar pasar!',
        after: 'Me quito el sombrero, jugaste mejor.'
      },
      cinematics: {
        beforeMatch: '🎵 La hinchada canta tu nombre por primera vez',
        onGoal: '🔥 El estadio explota en euforia',
        onWin: '🏆 Los rivales te felicitan uno por uno'
      },
      rivalSpecial: 'Su arquero es un muro, vas a necesitar creatividad',
      rewardMessage: '¡Dos victorias! La gente empieza a creer en vos.'
    },
    {
      id: 'rookie_3',
      title: '🌟 EL PARTIDO SOÑADO',
      intro: 'Final de la liga rookie. Todo se define hoy. Si ganás, ascendés. Si perdés, todo termina. Las piernas tiemblan, pero el corazón está firme.',
      opponentQuotes: {
        before: '"El ascenso es nuestro. Preparate para la gloria" - El capitán rival levanta la copa',
        during: '¡No te rindas, esto recién empieza!',
        after: 'Te ganaron merecidamente. Ascendiste con honores.'
      },
      cinematics: {
        beforeMatch: '🏟️ Los fuegos artificiales iluminan el cielo',
        onGoal: '💫 Gol para la historia. Te arrodillás y mirás al cielo',
        onWin: '🎊 ¡CAMPEONES! Te levantan en hombros'
      },
      rivalSpecial: 'Juegan como un equipo de primera división, pero vos naciste para esto',
      rewardMessage: '🏆 ¡ASCENDISTE! La prensa te entrevista. Sos la nueva promesa.'
    }
  ],
  bronze: [
    {
      id: 'bronze_1',
      title: '🥉 EL SALTO DE CALIDAD',
      intro: 'Llegaste a la liga Bronce. Los equipos son más fuertes, más rápidos. El técnico te dice: "Olvidate de la rookie, esto es otro nivel".',
      opponentQuotes: {
        before: '"Acá no hay lugar para novatos. Demostrá que merecés estar" - Defensor rival te mira fijo',
        after: 'Sos duro de roer. Respeto.'
      },
      cinematics: {
        beforeMatch: '📋 Los periodistas analizan tu debut en bronce',
        onWin: '⚡ Silencio en el estadio. Les ganaste.'
      },
      rivalSpecial: 'Su mediocampo es una máquina perfecta',
      rewardMessage: 'Primera victoria en bronce. La exigencia sube.'
    },
    {
      id: 'bronze_2',
      title: '🛡️ EL MURO',
      intro: 'Te enfrentás al equipo con la mejor defensa. Llevan 5 partidos sin recibir goles. Romper su récord sería una locura... pero las locuras se hacen.',
      opponentQuotes: {
        before: '"Ningún delantero nos ha pasado. Vos no vas a ser el primero" - El central sonríe con seguridad',
        during: '¡Pará quieto, carajo!',
        after: 'Nos rompiste. Sos diferente.'
      },
      cinematics: {
        beforeMatch: '🧱 Forman un muro humano. Imponente.',
        onGoal: '💥 ¡GOLAZO! El estadio no lo puede creer'
      },
      rivalSpecial: 'Si les hacés un gol, se desmoronan emocionalmente',
      rewardMessage: '¡Les rompiste el récord! Sos un héroe.'
    },
    {
      id: 'bronze_3',
      title: '🏆 LA FINAL DEL BRONCE',
      intro: 'Todo o nada. El equipo campeón defensor te espera. Tienen una racha de 10 victorias. La gente dice que es imposible. Vos solo sonreís.',
      opponentQuotes: {
        before: '"Prepará las maletas, rookie. Esto no es para vos" - El goleador te subestima',
        during: '¡Dale! ¡No te achiques!',
        after: 'Sos el mejor rival que enfrentamos. Respeto eterno.'
      },
      cinematics: {
        beforeMatch: '🏟️ 50,000 personas. La presión es real.',
        onGoal: '🌙 Gol de media chilena. Una obra de arte',
        onWin: '🎉🎉 ¡CAMPEOOOONES! La copa es tuya'
      },
      rivalSpecial: 'Tienen una estrella mundial. Si lo marcás bien, se frustra',
      rewardMessage: '🥈 ¡ASCENDISTE A PLATA! Los grandes te empiezan a mirar.'
    }
  ],
  silver: [
    {
      id: 'silver_1',
      title: '🌙 BAJO LA LUNA',
      intro: 'Partido nocturno. Las luces del estadio brillan como estrellas. El rival es un equipo misterioso que nunca pierde de noche. Dicen que tienen un pacto...',
      opponentQuotes: {
        before: '"La noche es nuestra. Preparate para perder" - El capitán con capa negra',
        after: 'Nos ganaste de día... y de noche. Sos especial.'
      },
      cinematics: {
        beforeMatch: '🌕 La luna llena ilumina la cancha',
        onGoal: '✨ Magia pura. El público enmudece'
      },
      rivalSpecial: 'Juegan mejor de noche. Su energía es diferente',
      rewardMessage: 'Venciste a la leyenda. Sos imparable.'
    },
    {
      id: 'silver_2',
      title: '💨 EL FANTASMA',
      intro: 'Un delantero que aparece y desaparece. Nadie puede marcarlo. Dicen que es un fantasma. Hoy lo enfrentás. Si lo parás, serás leyenda.',
      opponentQuotes: {
        before: '"Intenta atraparme... si podés" - Ríe mientras hace jueguitos',
        during: '¡No te puedo creer! ¿Cómo me paraste?',
        after: 'Sos el único que me ha detenido.'
      },
      cinematics: {
        beforeMatch: '🌫️ Niebla artificial. Crea misterio.',
        onGoal: '💨 Lo marcaste tan bien que desapareció'
      },
      rivalSpecial: 'Su velocidad es demoníaca. Necesitás anticiparte',
      rewardMessage: 'Atrapaste al fantasma. Sos un defensor único.'
    },
    {
      id: 'silver_3',
      title: '⚡ GUERRA DE TITANES',
      intro: 'Final de plata. El equipo invencible. 20 partidos sin perder. La prensa ya les dio el título. Solo falta jugarlo. Salís al campo con una sonrisa.',
      opponentQuotes: {
        before: '"No hay nada que puedas hacer. Somos superiores" - El técnico rival se sienta tranquilo',
        during: '¡Este pibe está loco! ¡Está jugando como si no hubiera mañana!',
        after: 'Nos destruiste. Sos el elegido.'
      },
      cinematics: {
        beforeMatch: '📰 Todos los diarios dan por perdido el partido',
        onGoal: '🔥 Gol de rabona. La jugada del año',
        onWin: '🏆🏆 ¡DOBLETE! La copa de plata es tuya'
      },
      rivalSpecial: 'Son perfectos tácticamente, pero vos tenés algo que ellos no: CORAZÓN',
      rewardMessage: '🥇 ¡ORO! Ahora los grandes te respetan.'
    }
  ],
  gold: [
    {
      id: 'gold_1',
      title: '👑 REYES DE ORO',
      intro: 'Llegaste a la élite. Todos los equipos tienen estrellas mundiales. Te miran con recelo. El árbitro te dice: "Bienvenido al infierno".',
      opponentQuotes: {
        before: '"El oro es para reyes, no para plebeyos" - La estrella rival te ignora',
        after: 'Nos humillaste. Te odio... pero te respeto.'
      },
      cinematics: {
        beforeMatch: '👑 Alfombra roja. Es otro mundo.',
        onGoal: '💪 Gol de chilena. La elite se sorprende'
      },
      rivalSpecial: 'Cada jugador vale millones. El ego es su debilidad',
      rewardMessage: 'Les ganaste a los millonarios. El pueblo te ama.'
    },
    {
      id: 'gold_2',
      title: '🐉 EL DRAGÓN',
      intro: 'El delantero más temido. 50 goles en la temporada. Le dicen "El Dragón". Escupe fuego cada vez que patea. Hoy lo enfrentás solo.',
      opponentQuotes: {
        before: '"Voy a destrozarte. Preparate para sufrir" - El Dragón ruge',
        during: '¡No puede ser! ¡Me sacaste la pelota!',
        after: 'Sos el único que me ha parado. Sos un dragón también.'
      },
      cinematics: {
        beforeMatch: '🐉 Humo en la entrada del estadio. Intimidante.',
        onGoal: '🛡️ Lo marcaste tan bien que se fue expulsado'
      },
      rivalSpecial: 'Si lo provocás, pierde la cabeza. Es su único defecto',
      rewardMessage: 'Domaste al dragón. Sos una leyenda viviente.'
    },
    {
      id: 'gold_3',
      title: '🌟 LA CORONACIÓN',
      intro: 'La final de oro. El partido más importante de tu vida. Si ganás, te consagrás. Si perdés, habrá sido un sueño. El silbido inicial...',
      opponentQuotes: {
        before: '"El oro es nuestro. La copa es nuestra. Vete, intruso." - Todo el equipo te rodea',
        during: '¡Este pibe es imparable! ¡Márquenlo entre tres!',
        after: 'Sos el mejor jugador que enfrentamos. La copa es tuya.'
      },
      cinematics: {
        beforeMatch: '🏆 La copa brilla. La podés tocar.',
        onGoal: '⭐ GOLAZO DESDE MEDIA CANCHA. HISTÓRICO',
        onWin: '🎉🎉🎉 ¡ERES LEYENDA! El público te aplaude de pie'
      },
      rivalSpecial: 'Juegan como un equipo de Champions. Pero vos sos diferente',
      rewardMessage: '🏆 ¡CAMPEÓN DE ORO! Los grandes te ofrecen contratos.'
    }
  ],
  champion: [
    {
      id: 'champion_1',
      title: '⚔️ EL JUICIO FINAL',
      intro: 'Llegaste a la cima. El último obstáculo. Un equipo legendario, invicto por 3 años. La prensa dice que es imposible. El técnico solo te dice: "Hacé historia".',
      opponentQuotes: {
        before: '"Muchos intentaron. Todos fallaron. ¿Vos qué te crees?" - El mítico 10 se ríe',
        after: 'Nos rompiste el invicto. Sos eterno.'
      },
      cinematics: {
        beforeMatch: '🏟️ 100,000 almas contienen la respiración',
        onGoal: '⚔️ Gol de palomita. El estadio enloquece'
      },
      rivalSpecial: 'Son perfectos en todo. Solo el corazón puede vencerlos',
      rewardMessage: '¡LES GANASTE! El mundo del fútbol te aplaude.'
    },
    {
      id: 'champion_2',
      title: '🌈 EL PARTIDO PERFECTO',
      intro: 'El equipo más odiado. Juegan sucio, provocan, insultan. Todos quieren que pierdan. Hoy sos el elegido para darles su merecido.',
      opponentQuotes: {
        before: '"Te vamos a romper. Esto no es fútbol, es guerra." - El capitán te amenaza',
        during: '¡No puede ser! ¡Nos está bailando!',
        after: 'Nos diste una lección. Gracias por humillarnos.'
      },
      cinematics: {
        beforeMatch: '😤 Silbidos a tu rival. La gente los odia',
        onGoal: '💫 Gol olímpico. Directo del córner'
      },
      rivalSpecial: 'Juegan sucio. Necesitás mantener la calma',
      rewardMessage: 'Les diste su merecido. El pueblo te ama más.'
    },
    {
      id: 'champion_3',
      title: '🏆 EL ÚLTIMO PARTIDO',
      intro: 'La final definitiva. El campeón de campeones. Si ganás, tu nombre quedará grabado en la historia. Si perdés, será el fin. Todo o nada.',
      opponentQuotes: {
        before: '"Aquí se forjan las leyendas. ¿Estás listo?" - El entrenador legendario te mira a los ojos',
        during: '¡Este pibe nació para esto! ¡Mírenlo cómo juega!',
        after: 'Hoy naciste leyenda. Nos inclinamos ante vos.'
      },
      cinematics: {
        beforeMatch: '🎆 ESPECTÁCULO DE LUZ Y SONIDO',
        onGoal: '🏆 GOL PARA LA ETERNIDAD. TE ARRODILLAS Y LLORAS',
        onWin: '👑 ¡ERES EL MEJOR DE TODOS! TE CORONAN REY'
      },
      rivalSpecial: 'Tienen a los 11 mejores del mundo. Pero vos tenés algo más: DESTINO',
      rewardMessage: '🏆🏆🏆 ¡CAMPEÓN ABSOLUTO! Tu nombre es eterno.'
    }
  ]
};