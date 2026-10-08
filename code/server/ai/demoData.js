// Sample lectures and question bank used by the demo AI provider (no API key needed).

export const C = {
  chlorophyll: 'Chlorophyll & Light Absorption',
  light: 'Light-Dependent Reactions',
  calvin: 'Calvin Cycle',
  limiting: 'Limiting Factors',
  inertia: 'Inertia (First Law)',
  second: 'Force & Acceleration (Second Law)',
  third: 'Action-Reaction Pairs (Third Law)',
  friction: 'Friction & Net Force',
}

export const DEMO_LECTURES = [
  {
    key: 'photo-light',
    keywords: ['light', 'pigment', 'chlorophyll', 'sunlight', 'photosynthesis'],
    title: 'Capturing Sunlight: Pigments & Light Reactions',
    transcript:
      "Good morning everyone. Today we start photosynthesis, the process plants use to turn light energy into chemical energy. Everything begins in the chloroplast, and inside it the thylakoid membranes, stacked like coins into grana. Embedded in those membranes is chlorophyll, the main pigment. Notice that chlorophyll absorbs mostly red and blue light and reflects green, which is why leaves look green. Accessory pigments like carotenoids widen the range of light a leaf can use. Now, the light-dependent reactions. These happen in the thylakoid membranes. Light excites electrons in chlorophyll, and that energy is used to split water molecules. Splitting water releases oxygen as a by-product, that is the oxygen we breathe, and it comes from water, not from carbon dioxide. The energy captured is stored in two carrier molecules, ATP and NADPH. Remember these two, because next class the Calvin cycle will spend them to build sugar.",
    summary:
      'Photosynthesis converts light energy to chemical energy inside chloroplasts. Chlorophyll in the thylakoid membranes absorbs red and blue light, and the light-dependent reactions split water to release oxygen while producing ATP and NADPH.',
    sections: [
      {
        heading: 'Where photosynthesis happens',
        body: 'Photosynthesis takes place in chloroplasts. Thylakoid membranes, stacked into grana, hold the pigments and the machinery for the light reactions. The fluid around them is the stroma.',
      },
      {
        heading: 'Pigments and light',
        body: 'Chlorophyll absorbs mostly red and blue wavelengths and reflects green, so leaves appear green. Accessory pigments such as carotenoids and chlorophyll b broaden the usable spectrum.',
      },
      {
        heading: 'Light-dependent reactions',
        body: 'In the thylakoid membranes, light energy excites electrons and splits water. Oxygen is released as a by-product (it comes from water, not CO2). The energy is stored as ATP and NADPH for the Calvin cycle.',
      },
    ],
    keyTerms: [
      { term: 'Chloroplast', definition: 'The organelle where photosynthesis occurs.' },
      { term: 'Thylakoid', definition: 'Membrane sacs in the chloroplast that host the light reactions.' },
      { term: 'ATP', definition: 'Energy-carrying molecule produced in the light reactions.' },
      { term: 'NADPH', definition: 'Electron carrier made in the light reactions and used to build sugar.' },
    ],
    concepts: [
      {
        name: C.chlorophyll,
        description: 'Chlorophyll absorbs mostly red and blue light and reflects green, which is why leaves look green.',
      },
      {
        name: C.light,
        description:
          'Reactions in the thylakoid membranes that use light to split water, releasing oxygen and making ATP and NADPH.',
      },
    ],
  },
  {
    key: 'photo-calvin',
    keywords: ['calvin', 'limiting', 'sugar', 'glucose', 'stroma', 'carbon'],
    title: 'Building Sugar: Calvin Cycle & Limiting Factors',
    transcript:
      "Last class we ended with ATP and NADPH. Today we see how the plant spends them. The Calvin cycle takes place in the stroma of the chloroplast. Its job is to fix carbon dioxide into sugar. An enzyme called rubisco attaches CO2 to a five carbon molecule, and through a series of steps, powered by ATP and NADPH, the cycle produces three carbon sugars that are assembled into glucose. Here's the subtle point: the Calvin cycle doesn't use light directly. But it can't keep running without the ATP and NADPH from the light reactions, so at night it slows and stops. Finally, limiting factors. The rate of photosynthesis depends on light intensity, carbon dioxide concentration and temperature. Whichever factor is in shortest supply limits the rate. If you increase light but the rate plateaus, then another factor, like carbon dioxide or temperature, has become limiting.",
    summary:
      'The Calvin cycle runs in the stroma and uses ATP and NADPH to fix CO2 into sugar; it depends on the light reactions indirectly. The overall rate of photosynthesis is capped by whichever factor, light, CO2 or temperature, is in shortest supply.',
    sections: [
      {
        heading: 'The Calvin cycle',
        body: 'Occurs in the stroma. Rubisco attaches CO2 to a five-carbon molecule; ATP and NADPH power the steps that produce three-carbon sugars, which are built into glucose.',
      },
      {
        heading: 'Link to the light reactions',
        body: 'The cycle does not use light directly, but it needs the ATP and NADPH made by the light reactions. Without light those run out, so the Calvin cycle stops.',
      },
      {
        heading: 'Limiting factors',
        body: 'Light intensity, CO2 concentration and temperature can each limit the rate. When the rate plateaus despite more of one factor, another factor is now limiting.',
      },
    ],
    keyTerms: [
      { term: 'Stroma', definition: 'The fluid-filled space in the chloroplast where the Calvin cycle runs.' },
      { term: 'Rubisco', definition: 'Enzyme that fixes CO2 in the Calvin cycle.' },
      { term: 'Carbon fixation', definition: 'Attaching inorganic CO2 to an organic molecule.' },
      { term: 'Limiting factor', definition: 'The resource in shortest supply that caps a reaction rate.' },
    ],
    concepts: [
      {
        name: C.calvin,
        description:
          'Stroma-based cycle that uses ATP and NADPH to fix carbon dioxide into sugar; it needs the light reactions but not light directly.',
      },
      {
        name: C.limiting,
        description:
          'Light intensity, CO2 concentration and temperature can cap the rate of photosynthesis; the scarcest one limits the rate.',
      },
    ],
  },
  {
    key: 'motion-first-second',
    keywords: ['inertia', 'first law', 'second law', 'newton', 'force', 'motion', 'acceleration'],
    title: 'Inertia and Newton\'s Second Law',
    transcript:
      "Welcome back. Let's talk about why things move. Newton's first law says an object stays at rest, or keeps moving at constant velocity in a straight line, unless a net external force acts on it. This tendency is called inertia, and it is not a force, it's a property of matter. A book on a table is at rest because gravity and the normal force balance, so the net force is zero. When a bus brakes suddenly, you lurch forward because your body tends to keep its original velocity. Also, an object doesn't need a force to keep moving, only to change its motion. Now the second law: the acceleration of an object is directly proportional to the net force and inversely proportional to its mass. In symbols, F equals m a. So a two kilogram cart with a six newton net force accelerates at three metres per second squared. Double the mass and the acceleration halves.",
    summary:
      'Newton\'s first law: with zero net force an object stays at rest or moves at constant velocity; inertia is the tendency to resist changes in motion. Newton\'s second law, F = ma, links net force, mass and acceleration.',
    sections: [
      {
        heading: 'First law and inertia',
        body: 'An object keeps its state of rest or uniform motion unless a net external force acts. Inertia is a property of matter, not a force. Continuing to move does not require a force.',
      },
      {
        heading: 'Everyday examples',
        body: 'A book on a table is at rest because the forces balance (net force zero). Passengers lurch forward when a bus brakes because their bodies keep the original velocity.',
      },
      {
        heading: 'Second law: F = ma',
        body: 'Acceleration is proportional to net force and inversely proportional to mass. A 2 kg cart with 6 N net force accelerates at 3 m/s^2; doubling the mass halves the acceleration.',
      },
    ],
    keyTerms: [
      { term: 'Inertia', definition: 'The tendency of an object to resist changes in its motion.' },
      { term: 'Net force', definition: 'The vector sum of all forces acting on an object.' },
      { term: 'Newton (N)', definition: 'The SI unit of force: 1 kg m/s^2.' },
      { term: 'Acceleration', definition: 'The rate of change of velocity.' },
    ],
    concepts: [
      {
        name: C.inertia,
        description:
          'An object keeps its state of rest or constant velocity unless a net external force acts; inertia is a property, not a force.',
      },
      {
        name: C.second,
        description: 'Net force equals mass times acceleration (F = ma): more force means more acceleration, more mass means less.',
      },
    ],
  },
  {
    key: 'motion-third-friction',
    keywords: ['action', 'reaction', 'third law', 'friction', 'net force', 'pair'],
    title: 'Action-Reaction and Friction',
    transcript:
      "Today, Newton's third law and friction. The third law says that when object A exerts a force on object B, B exerts an equal and opposite force on A. These two forces are a pair, they act on different objects, so they never cancel each other. When you push a wall, the wall pushes back on you equally. A rocket moves forward because it pushes exhaust gas backward, and the gas pushes the rocket forward, no air needed. Now friction. Friction is a contact force that opposes the relative sliding, or attempted sliding, of two surfaces. If you push a box at constant velocity with twenty newtons, friction must be twenty newtons the other way, because constant velocity means zero net force. And if you push a five kilogram crate with ten newtons against four newtons of friction, the net force is six newtons, so the acceleration is one point two metres per second squared.",
    summary:
      'Newton\'s third law: forces come in equal and opposite pairs acting on different objects. Friction opposes sliding; at constant velocity the net force is zero, and otherwise F_net = ma uses the vector sum including friction.',
    sections: [
      {
        heading: 'Third law pairs',
        body: 'Forces act in pairs, equal in size and opposite in direction, on different objects. Because they act on different objects they do not cancel each other.',
      },
      {
        heading: 'Examples',
        body: 'Pushing a wall: the wall pushes back equally. A rocket pushes exhaust backward and the exhaust pushes the rocket forward, so it works in empty space.',
      },
      {
        heading: 'Friction and net force',
        body: 'Friction opposes (attempted) relative sliding. At constant velocity, the push equals friction (net force zero). Otherwise net force = applied force minus friction, and a = F_net / m.',
      },
    ],
    keyTerms: [
      { term: 'Action-reaction pair', definition: 'Two equal and opposite forces acting on two different objects.' },
      { term: 'Friction', definition: 'Contact force that opposes relative sliding between surfaces.' },
      { term: 'Equilibrium', definition: 'State in which the net force on an object is zero.' },
      { term: 'Thrust', definition: 'Forward force on a rocket from expelled exhaust.' },
    ],
    concepts: [
      {
        name: C.third,
        description: 'Forces come in equal and opposite pairs that act on different objects, so the pair never cancels itself.',
      },
      {
        name: C.friction,
        description:
          'Friction opposes sliding between surfaces; net force is the vector sum of all forces, and it is zero at constant velocity.',
      },
    ],
  },
]

const Q = (concept, difficulty, prompt, options, correctIndex, explanation, wrongNotes) => {
  const notes = [...wrongNotes]
  return {
    concept,
    difficulty,
    prompt,
    options,
    correctIndex,
    explanation,
    distractorNotes: options.map((_, i) => (i === correctIndex ? '' : notes.shift())),
  }
}

export const QUESTION_BANK = [
  // Chlorophyll & Light Absorption
  Q(C.chlorophyll, 1, 'Why do most leaves look green?', [
    'Chlorophyll absorbs green light and uses it for photosynthesis',
    'Chlorophyll reflects green light while absorbing mostly red and blue',
    'Leaf cell walls filter out every colour except green',
    'Water inside leaves turns sunlight green',
  ], 1, 'Chlorophyll absorbs mostly red and blue wavelengths, and the green light that is left over is reflected to our eyes.', [
    'Confuses the colour that is seen with the colour that is absorbed.',
    'Credits cell walls instead of pigments for leaf colour.',
    'Credits water instead of pigments for leaf colour.',
  ]),
  Q(C.chlorophyll, 2, 'A leaf is placed under pure green light only. Compared with white light, photosynthesis will most likely be:', [
    'Much slower, because chlorophyll absorbs little green light',
    'Faster, because green is the colour chlorophyll absorbs best',
    'Unchanged, because every wavelength works equally well',
    'Stopped completely, because plants cannot use any green light',
  ], 0, 'Chlorophyll reflects most green light, so little energy is captured and the rate falls sharply (but not to exactly zero).', [
    'Believes green is the best-absorbed colour because leaves look green.',
    'Believes all wavelengths are used equally by chlorophyll.',
    'Overstates the effect: some green light is still absorbed by accessory pigments.',
  ]),
  Q(C.chlorophyll, 3, "Chlorophyll's absorption spectrum peaks in blue and red. Which conclusion is best supported?", [
    'Plants grow fastest under green light',
    'The action spectrum of photosynthesis roughly follows the absorption peaks of the pigments',
    'Chlorophyll a is the only pigment in leaves, so other pigments play no role',
    'Infrared light drives the light reactions most strongly',
  ], 1, 'Light that is absorbed drives photosynthesis, so the rate of photosynthesis per wavelength tracks pigment absorption.', [
    'Contradicts the spectrum: green is the least absorbed visible colour.',
    'Ignores accessory pigments such as carotenoids and chlorophyll b.',
    'Confuses infrared with the visible range that chlorophyll absorbs.',
  ]),

  // Light-Dependent Reactions
  Q(C.light, 1, 'Where do the light-dependent reactions take place?', [
    'Stroma',
    'Thylakoid membranes',
    'Mitochondrial matrix',
    'Cell nucleus',
  ], 1, 'The light-dependent reactions occur in the thylakoid membranes where chlorophyll is embedded.', [
    'Mixes up the location of the Calvin cycle with the light reactions.',
    'Confuses the chloroplast with the mitochondrion.',
    'Does not link the reactions to the chloroplast at all.',
  ]),
  Q(C.light, 2, 'Which gas is released when water is split during the light-dependent reactions?', [
    'Carbon dioxide',
    'Hydrogen',
    'Oxygen',
    'Nitrogen',
  ], 2, 'Splitting water (photolysis) releases oxygen as a by-product; the hydrogen is carried by NADPH.', [
    'Thinks the oxygen released comes from carbon dioxide (a very common misconception).',
    'Confuses the hydrogen that is captured in NADPH with the gas that is released.',
    'No link to the reaction: nitrogen is not involved in photosynthesis.',
  ]),
  Q(C.light, 3, 'Which pair of molecules made in the light-dependent reactions is used by the Calvin cycle?', [
    'Glucose and O2',
    'ATP and NADPH',
    'ADP and NADP+',
    'CO2 and H2O',
  ], 1, 'ATP and NADPH carry the captured energy and electrons to the Calvin cycle, which spends them to build sugar.', [
    'Treats glucose as a light-reaction product (it is the Calvin cycle output).',
    'Reverses the cycle: ADP and NADP+ are the spent forms returned to the light reactions.',
    'Lists the raw inputs of photosynthesis rather than the products of the light reactions.',
  ]),

  // Calvin Cycle
  Q(C.calvin, 1, 'What is the main job of the Calvin cycle?', [
    'Splitting water to release oxygen',
    'Capturing light energy with chlorophyll',
    'Building sugars from carbon dioxide',
    'Breaking down glucose to release energy',
  ], 2, 'The Calvin cycle fixes CO2 into three-carbon sugars that are built into glucose.', [
    'Confuses the Calvin cycle with the light-dependent reactions.',
    'Confuses the Calvin cycle with the light-dependent reactions.',
    'Confuses photosynthesis with cellular respiration.',
  ]),
  Q(C.calvin, 2, 'In which part of the chloroplast does the Calvin cycle occur?', [
    'Stroma',
    'Thylakoid lumen',
    'Outer membrane',
    'Grana stacks',
  ], 0, 'The Calvin cycle runs in the stroma, the fluid surrounding the thylakoids.', [
    'Places the cycle in the light-reaction compartment.',
    'Has no clear picture of chloroplast structure.',
    'Grana are thylakoid stacks, where the light reactions happen.',
  ]),
  Q(C.calvin, 3, "At night a plant's Calvin cycle slows and stops. What is the best explanation?", [
    'The Calvin cycle uses light directly to fix CO2',
    'Without light, no new ATP and NADPH are being made to power it',
    'Stomata open at night, flooding the leaf with CO2',
    'Glucose is destroyed at night',
  ], 1, 'The cycle needs ATP and NADPH from the light reactions; without light those supplies run out.', [
    'Believes the Calvin cycle uses light directly rather than depending on ATP and NADPH.',
    'Misunderstands how stomata and gas exchange relate to the cycle.',
    'Invents a destruction process that does not exist.',
  ]),

  // Limiting Factors
  Q(C.limiting, 1, 'Which of these is NOT a factor that can limit the rate of photosynthesis?', [
    'Light intensity',
    'Carbon dioxide concentration',
    'Temperature',
    'The colour of the flower pot',
  ], 3, 'Light, CO2 and temperature all limit the rate; the colour of the pot has no direct effect.', [
    'Light intensity is a major limiting factor.',
    'CO2 concentration is a major limiting factor.',
    'Temperature affects enzyme activity and so limits the rate.',
  ]),
  Q(C.limiting, 2, 'On a graph, the rate of photosynthesis rises with light intensity and then plateaus. At the plateau, more light has no effect because:', [
    'Chlorophyll is destroyed by bright light',
    'Another factor, such as CO2 or temperature, is now limiting',
    'Photosynthesis has stopped completely',
    'Plants cannot absorb light at any intensity',
  ], 1, 'Once light is no longer the scarcest factor, the rate is held back by another factor like CO2 or temperature.', [
    'Assumes bright light always damages chlorophyll.',
    'Reads the plateau as the process stopping rather than a different limit.',
    'Contradicts the rising part of the graph.',
  ]),
  Q(C.limiting, 3, 'A greenhouse owner raises CO2 levels but sees no extra growth on a dim, cloudy day. Why?', [
    'Light is limiting, so the extra CO2 cannot be used',
    'CO2 is toxic to plants at any raised level',
    'Plants only use CO2 at night',
    'Temperature has no effect on enzymes',
  ], 0, 'On a dim day light is the limiting factor, so adding more of a non-limiting factor changes nothing.', [
    'Overgeneralises that more CO2 is harmful.',
    'Mixes up when carbon dioxide is used (the Calvin cycle depends on daytime ATP supply).',
    'Ignores the role of temperature entirely.',
  ]),

  // Inertia
  Q(C.inertia, 1, "According to Newton's first law, why does a book resting on a table stay at rest?", [
    'No forces act on it at all',
    'The forces on it are balanced, so the net force is zero',
    'Objects naturally prefer to be at rest',
    'Inertia pushes the book down onto the table',
  ], 1, 'Gravity and the normal force are equal and opposite, so the net force is zero and the book stays at rest.', [
    'Thinks "at rest" means no forces, ignoring gravity and the normal force.',
    'Holds the old idea that rest is the natural state of objects.',
    'Treats inertia as a force that pushes.',
  ]),
  Q(C.inertia, 2, 'A bus brakes suddenly and passengers lurch forward. The best explanation is:', [
    'A forward force pushes the passengers',
    'Their bodies tend to keep moving at the original velocity',
    'Gravity pulls them forward',
    'The seat pushes them forward',
  ], 1, 'Inertia: the passengers keep their forward velocity while the bus slows down beneath them.', [
    'Invents a forward force instead of recognising inertia.',
    'Gravity acts downward, not forward.',
    'The seat pushes backwards on passengers while the bus decelerates.',
  ]),
  Q(C.inertia, 3, 'A hockey puck slides across ice at constant velocity with negligible friction. What force keeps it moving?', [
    'A forward force that the puck stored from the original push',
    'No horizontal force is needed to keep it moving',
    'Gravity acting forward',
    'The air pushing it along',
  ], 1, 'With zero net force an object continues at constant velocity; motion does not need a force to be maintained.', [
    'Impetus misconception: believes a push is "stored" in the object.',
    'Gravity acts downward, not horizontally.',
    'Air resistance opposes motion, it does not drive it.',
  ]),

  // Force & Acceleration
  Q(C.second, 1, "Which equation expresses Newton's second law?", [
    'F = m + a',
    'F = m a',
    'F = m / a',
    'F = a / m',
  ], 1, "Newton's second law states net force equals mass times acceleration.", [
    'Adds quantities that have different units.',
    'Divides mass by acceleration instead of multiplying.',
    'Inverts the relationship between force and mass.',
  ]),
  Q(C.second, 2, 'A 2 kg cart experiences a net force of 6 N. What is its acceleration?', [
    '12 m/s²',
    '3 m/s²',
    '0.33 m/s²',
    '4 m/s²',
  ], 1, 'a = F / m = 6 N / 2 kg = 3 m/s².', [
    'Multiplied force by mass instead of dividing.',
    'Divided mass by force, inverting the formula.',
    'Subtracted mass from force.',
  ]),
  Q(C.second, 3, 'The same net force acts on a 2 kg block and a 4 kg block. Compared with the 2 kg block, the 4 kg block accelerates:', [
    'Twice as much',
    'By the same amount',
    'Half as much',
    'One quarter as much',
  ], 2, 'a = F / m, so doubling the mass halves the acceleration.', [
    'Thinks heavier objects accelerate more.',
    'Ignores mass in the relationship.',
    'Over-corrects by squaring the effect of mass.',
  ]),

  // Action-Reaction
  Q(C.third, 1, 'When you push on a wall, the wall pushes back on you with:', [
    'No force',
    'A smaller force',
    'An equal force in the opposite direction',
    'A larger force',
  ], 2, "Newton's third law: the forces in a pair are always equal in size and opposite in direction.", [
    'Believes passive objects cannot exert forces.',
    'Believes the reaction is weaker than the action.',
    'Believes the reaction is stronger than the action.',
  ]),
  Q(C.third, 2, 'A horse pulls a cart and the cart pulls back on the horse equally. Why can the cart still accelerate?', [
    'The action and reaction forces cancel on the cart',
    'The pair acts on different objects, so they do not cancel each other',
    'The horse pulls harder than the cart pulls back',
    'The reaction force appears a moment later',
  ], 1, 'The pair acts on two different objects. Only the forces on the cart matter for the cart, and they are unbalanced.', [
    'Cancels third-law pairs even though they act on different objects.',
    'Violates the third law: the forces are always equal.',
    'Invents a time delay between action and reaction.',
  ]),
  Q(C.third, 3, 'A rocket accelerates in empty space where there is no air. What provides the forward force?', [
    'Exhaust gas pushing against the surrounding air',
    'The rocket pushes exhaust backward and the exhaust pushes the rocket forward',
    "The gravity of nearby planets",
    "The engine's inertia",
  ], 1, 'Third law: the rocket exerts a force on the exhaust and the exhaust exerts an equal and opposite force on the rocket.', [
    'Thinks a rocket needs air to push against.',
    'Gravity is not the source of thrust.',
    'Treats inertia as a force.',
  ]),

  // Friction & Net Force
  Q(C.friction, 1, 'Friction between two surfaces acts:', [
    'In the direction of motion',
    'Opposite to the direction of sliding or attempted sliding',
    'Perpendicular to the surface',
    'Only on objects that are already moving',
  ], 1, 'Friction opposes relative sliding or attempted sliding between surfaces.', [
    'Thinks friction helps motion instead of opposing it.',
    'Confuses friction with the normal force.',
    'Forgets static friction, which acts on objects that are not yet moving.',
  ]),
  Q(C.friction, 2, 'You push a box at constant velocity with a force of 20 N. The friction force on the box is:', [
    'Less than 20 N',
    'Exactly 20 N, opposing the push',
    'More than 20 N',
    'Zero, because the box is moving',
  ], 1, 'Constant velocity means zero net force, so friction must exactly balance the 20 N push.', [
    'Believes a net forward force is needed to keep moving.',
    'Believes friction exceeds the push, which would slow the box.',
    'Thinks friction vanishes once motion begins.',
  ]),
  Q(C.friction, 3, 'A 10 N push moves a 5 kg crate against 4 N of friction. What is its acceleration?', [
    '2 m/s²',
    '1.2 m/s²',
    '2.8 m/s²',
    '0.8 m/s²',
  ], 1, 'Net force = 10 - 4 = 6 N, so a = 6 / 5 = 1.2 m/s².', [
    'Ignored friction and used the full push (10 / 5).',
    'Added friction to the push (14 / 5) instead of subtracting.',
    'Used only the friction force (4 / 5).',
  ]),
]
