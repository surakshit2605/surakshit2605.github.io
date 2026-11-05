/**
 * ALL SITE CONTENT LIVES HERE.
 * Edit this file only. Anything marked `placeholder: true` is shown with a
 * visible "PLACEHOLDER" badge. Remove that flag once you replace the text.
 * Nothing in this file is invented: only your name, university, degree and
 * dates come from you. Everything else is an empty, labelled placeholder.
 */

export const profile = {
  name: 'Surakshit Kessoonath',
  role: 'Computer Science Student · Network Security',
  // Short headline under your name. Edit freely.
  headline: 'Learning to build software and defend the networks it runs on.',
  intro:
    'BSc Computer Science – Network Security at the University of Technology, Mauritius (UTM).',
  location: 'Mauritius', // remove or change if you prefer
  // Photo shown next to your name (file in public/). Transparent background works best.
  // Leave '' to hide it.
  photo: 'portrait.webp',
  photoAlt: 'Portrait of Surakshit Kessoonath',
  // 'original' = your real photo with its background (default). 'cutout' = you cut out on a navy backdrop.
  photoStyle: 'original',
  photoOriginal: 'portrait-original.webp',
  photoCaption: 'Computer Science · Network Security',
};

export const about = {
  paragraphs: [
    {
      text: 'I am an undergraduate Computer Science student at the University of Technology, Mauritius, specialising in Network Security.',
    },
    {
      text: 'I chose this field because I want to understand how computer systems and networks work, and how to secure them. I enjoy solving technical problems and developing applications.',
    },
  ],
  interests: ['Software development', 'Programming', 'Networking', 'Cybersecurity'],
  ambitions: {
    text: 'I want to become a skilled IT professional in backend development, software engineering and network security. I am looking for an internship where I can work on real projects, improve my programming skills and learn from experienced professionals.',
  },
};

export const education = {
  institution: 'University of Technology, Mauritius (UTM)',
  degree: 'BSc Computer Science – Network Security',
  start: '2025-04-01', // ISO date, used to compute progress
  end: '2028-04-01',
  startLabel: 'April 2025',
  endLabel: 'April 2028 (Expected)',
  status: 'Undergraduate',
};

// Academic Background & Educational Journey.
// Put certificate scans in public/certificates/ and reference them as 'certificates/name.jpg'.
// Use only what is visible on each certificate: official name, awarding institution, date.
// `tags` are optional short facts. `portrait: true` for upright (tall) certificates.
// Add more certificates by copying an entry. Leave `year` empty if the date is not visible.
export const background = {
  title: 'Academic Background & Educational Journey',
  intro:
    'My path includes Hindi language examinations (2012 to 2016), ICT training at school in 2019, short professional courses in accounting and auditing in 2025, and now a degree in Computer Science with Network Security. The accounting training helped me develop analytical thinking, numerical understanding, attention to detail and problem-solving skills, which I now bring into my studies.',
  chapters: [
    {
      label: 'Chapter I',
      title: 'Hindi language (हिन्दी)',
      hideFromCertifications: true, // shown in Background only; set to false to also list these in Profile
      summary: 'Hindi language examinations of the Hindi Pracharini Sabha, Mauritius, from 2012 to 2016.',
      certificates: [
        {
          name: 'Second Class Examination (Pramaan Patra)',
          institution: 'Hindi Pracharini Sabha, Hindi Bhawan, Long Mountain, Mauritius',
          year: '2012',
          image: 'certificates/hindi-second-class-2012.jpg',
          portrait: true,
          tags: ['Certificate', 'Hindi Pracharini Sabha'],
          description: 'Passed the Hindi Pracharini Sabha examination for the Second Class. Sat at Vallée des Prêtres Government Pathshala.',
        },
        {
          name: 'Third Class Examination (Pramaan Patra)',
          institution: 'Hindi Pracharini Sabha, Hindi Bhawan, Long Mountain, Mauritius',
          year: '2013',
          image: 'certificates/hindi-third-class-2013.jpg',
          portrait: true,
          tags: ['Certificate', 'Hindi Pracharini Sabha'],
          description: 'Passed the Hindi Pracharini Sabha examination for the Third Class. Sat at Vallée des Prêtres Government Pathshala.',
        },
        {
          name: 'Fourth Class Examination (Pramaan Patra)',
          institution: 'Hindi Pracharini Sabha, Hindi Bhawan, Long Mountain, Mauritius',
          year: '2014',
          image: 'certificates/hindi-fourth-class-2014.jpg',
          portrait: true,
          tags: ['Certificate', 'Hindi Pracharini Sabha'],
          description: 'Passed the Hindi Pracharini Sabha examination for the Fourth Class. Sat at Vallée des Prêtres Hindi Pathshala.',
        },
        {
          name: 'Praveshika Examination (Pramaan Patra)',
          institution: 'Hindi Pracharini Sabha, Hindi Bhawan, Long Mountain, Mauritius',
          year: '2016',
          image: 'certificates/hindi-praveshika-2016.jpg',
          portrait: true,
          tags: ['Praveshika certificate', 'Hindi Pracharini Sabha'],
          description: 'Passed the Praveshika examination of the Hindi Pracharini Sabha, Mauritius. Certificate dated 23 November 2016. Date of birth and index number are hidden on the image.',
        },
      ],
    },
    {
      label: 'Chapter II',
      title: 'ICT foundations',
      summary: 'Computing training completed through my secondary school.',
      certificates: [
        {
          name: 'Internet and Computing Core Certification (IC3) Course',
          institution: 'National Computer Board, with the Ministry of Education, Tertiary Education, Science and Technology',
          year: 'October 2019',
          image: 'certificates/ic3-course-completion.jpg',
          tags: ['Certificate of Course Completion', 'Universal ICT Education Programme'],
          description:
            'Completed the IC3 training through Sir Abdool Razack Mohamed State Secondary School, Port Louis, organised by the National Computer Board in collaboration with the Ministry.',
        },
      ],
    },
    {
      label: 'Chapter III',
      title: 'Accounting',
      summary: 'Professional training in accounting, auditing and finance, January to April 2025.',
      certificates: [
        {
          name: 'Accounting Course for Accounts Clerk',
          institution: 'Professional Skill Invest Ltd (PSI)',
          year: '14 January – 11 February 2025',
          image: 'certificates/accounting-clerk-course.jpg',
          tags: ['Certificate of Completion', '21 hours'],
          description:
            'A 21-hour course held at Ebene Junction, Ebene. Topics included double entry, the cash book and ledgers, VAT, bank reconciliation, trial balance, profit and loss, balance sheet, payroll, income tax computation and a case study.',
        },
        {
          name: 'Advanced Technical Training for Accounting and Finance',
          institution: 'Professional Skill Invest Ltd (PSI)',
          year: '24 March – 7 April 2025',
          image: 'certificates/advanced-accounting-finance.jpg',
          tags: ['Certificate of Completion', '12 hours', 'MQA approved course'],
          description:
            'A 12-hour advanced training course in accounting and finance, held over three sessions at Ebene Junction, Ebene.',
        },
        {
          name: 'Understand the Basic Fundamentals & Practical Approach to Auditing',
          institution: 'Professional Skill Invest Ltd (PSI)',
          year: '25 March – 15 April 2025',
          image: 'certificates/auditing-fundamentals.jpg',
          tags: ['Certificate of Completion', '10 hours'],
          description:
            'A 10-hour auditing course held at Ebene Junction, Ebene. Topics included client acceptance and KYC, audit planning, materiality, risk assessment, tests of control, substantive testing and issuing the audit report.',
        },
      ],
    },
    {
      label: 'Chapter IV',
      title: 'Computer Science & Network Security',
      summary: `${education.degree} at ${education.institution}, with additional courses in networking, ethical hacking and robotics.`,
      certificates: [
        {
          name: 'Networking Basics',
          institution: 'Cisco Networking Academy',
          year: '',
          image: 'certificates/cisco-networking-basics.jpg',
          tags: ['Certificate of Course Completion', 'Student level credential'],
          description:
            'A student-level course on how networks work: network communication and types, Ethernet, IPv4 and IPv6 addressing, how routers connect networks, and testing and troubleshooting connectivity.',
        },
        {
          name: 'Ethical Hacker',
          institution: 'Cisco Networking Academy',
          year: '',
          image: 'certificates/cisco-ethical-hacker.jpg',
          tags: ['Certificate of Course Completion', 'Student level credential'],
          description:
            'A student-level course on ethical hacking and penetration testing. Topics listed on the certificate include information gathering, vulnerability scanning, social engineering, post-exploitation and writing a penetration testing report.',
        },
        {
          name: 'Introduction to Robotics and Applied Intelligent Systems',
          institution: 'African Leadership Unleashed Ltd',
          year: 'Awarded 26 July 2026',
          image: 'certificates/alu-robotics-attendance.jpg',
          portrait: true,
          tags: ['Certificate of Attendance', 'Non-award course'],
          description: 'Attended this introductory course in robotics and applied intelligent systems.',
          // Photos and short clips from the course, in two parts. Files live in public/robotics/.
          // Photos open in the viewer. Videos have no sound and only load when played.
          parts: [
            {
              label: 'Part 1',
              title: 'Arduino and electronics',
              text: 'Wiring LED circuits on a breadboard and programming an Arduino Uno. One photo shows the blink sketch in the Wokwi simulator next to the real circuit.',
              photos: [
                { src: 'robotics/arduino-wokwi-and-circuit.jpg', alt: 'Laptop showing an Arduino blink sketch in the Wokwi simulator, next to the real Arduino Uno, breadboard and green LED' },
                { src: 'robotics/arduino-led-circuit.jpg', alt: 'Arduino Uno connected by USB to a breadboard with a green LED' },
              ],
              videos: [
                { src: 'robotics/arduino-leds-1.mp4', poster: 'robotics/arduino-leds-1.jpg', caption: 'Three LEDs on the breadboard, driven by the Arduino' },
                { src: 'robotics/arduino-leds-2.mp4', poster: 'robotics/arduino-leds-2.jpg', caption: 'A larger LED circuit with several coloured LEDs' },
                { src: 'robotics/arduino-circuit-test.mp4', poster: 'robotics/arduino-circuit-test.jpg', caption: 'Testing a circuit: a blue LED lights up' },
              ],
            },
            {
              label: 'Part 2',
              title: 'LEGO EV3 robot',
              text: 'Building a tracked LEGO MINDSTORMS EV3 robot with a distance sensor, programming it with blocks in EV3 Classroom, and testing it on the floor.',
              photos: [
                { src: 'robotics/ev3-parts-kit.jpg', alt: 'LEGO MINDSTORMS Education EV3 kit with motors, sensors and parts sorted in trays' },
                { src: 'robotics/ev3-assembly.jpg', alt: 'Hands fitting a part to the EV3 brick during assembly, laptop on the table' },
                { src: 'robotics/ev3-robot-brick.jpg', alt: 'The EV3 brick with its green status light on the tracked robot, sensor cable plugged in, laptop and lab equipment behind' },
                { src: 'robotics/ev3-robot-bench.jpg', alt: 'The finished tracked EV3 robot on a lab bench' },
                { src: 'robotics/ev3-robot-and-code.jpg', alt: 'The EV3 robot next to a laptop showing its block program in EV3 Classroom' },
                { src: 'robotics/ev3-robot-closeup.jpg', alt: 'Close-up of the EV3 robot with its distance sensor lit red, laptop with code behind' },
              ],
              videos: [
                { src: 'robotics/ev3-robot-run.mp4', poster: 'robotics/ev3-robot-run.jpg', caption: 'The robot driving along a corridor' },
              ],
            },
          ],
        },
      ],
    },
  ],
  // Shown after the chapter at index `after` (here: after Accounting).
  bridge: {
    after: 2,
    label: 'The transition',
    text: `${education.startLabel}: started ${education.degree} at ${education.institution}, bringing analytical thinking and attention to detail into technology.`,
  },
};

// ---------------------------------------------------------------------------
// Personal & Professional Information (the "Profile" section)
// ---------------------------------------------------------------------------
export const info = {
  title: 'Personal & Professional Information',
  location: { country: 'Mauritius', place: 'Indian Ocean', timezone: 'Indian/Mauritius', zoneLabel: 'MUT · UTC+4' },
  // Current professional interests (interests, not claims of expertise).
  focus: [
    { name: 'Computer Science', icon: 'code' },
    { name: 'Network Security', icon: 'shield' },
    { name: 'Cybersecurity', icon: 'lock' },
    { name: 'Backend Development', icon: 'server' },
    { name: 'Database Management', icon: 'database' },
    { name: 'Software Engineering', icon: 'layers' },
    { name: 'Networking & Infrastructure', icon: 'network' },
  ],
  status: {
    current: 'Computer Science Undergraduate',
    looking: 'An internship in backend development, software engineering or network security',
  },
};

// Qualifications in progress (no certificate yet). Add a card here for anything you are currently studying.
export const qualifications = [
  {
    name: education.degree,
    institution: education.institution,
    year: `${education.startLabel} – ${education.endLabel}`,
    status: 'In progress',
    icon: 'graduation',
  },
];

// Certifications list.
// 1) Everything you add to a chapter of `background` above appears here automatically
//    (put the scan in public/certificates/ and fill name, institution, year, image, tags; add `link` for a credential URL).
// 2) For something that does not belong in the Background timeline, add it to `extraCertifications`.
// Set `hideFromCertifications: true` on a chapter, or `skip: true` on one certificate, to keep it out of this list.
export const extraCertifications = [
  // { name: 'Certificate name', institution: 'Issuer', year: 'March 2027', image: 'certificates/file.jpg', pdf: 'certificates/file.pdf', link: 'https://...', tags: ['Certificate'] },
];
export const certifications = [
  ...background.chapters
    .filter((ch) => !ch.hideFromCertifications)
    .flatMap((ch) => ch.certificates.filter((c) => !c.placeholder && !c.skip)),
  ...extraCertifications,
];

// Skills you have actually used. No levels or percentages on purpose.
// To add a skill, copy a line inside the right category:
//   { name: 'Tool name', icon: 'code', description: 'One short factual line.' }
// Available icons: code, terminal, database, globe, palette, server, network, grid,
// layers, route, filter, shield, key, lock, radar, branch, monitor, box, gear
export const skills = [
  {
    category: 'Programming Languages',
    icon: 'code',
    items: [
      { name: 'Java', icon: 'code', description: 'Object-oriented coursework: classes, objects, methods and file handling.' },
      { name: 'Python', icon: 'terminal', description: 'Used in Programming for Machine Learning coursework.' },
      { name: 'Java Swing', icon: 'monitor', description: 'Desktop interface for the GymPro Manager project.' },
      { name: 'SQL', icon: 'database', description: 'Database creation, queries, table relationships and data management.' },
    ],
  },
  {
    category: 'Databases',
    icon: 'database',
    items: [
      { name: 'MySQL', icon: 'database', description: 'Database design, tables, SQL queries and relational databases.' },
      { name: 'Oracle Database', icon: 'database', description: 'Database coursework and SQL practical exercises.' },
      { name: 'JDBC', icon: 'database', description: 'Connecting Java to MySQL for create, read, update and delete operations in GymPro Manager.' },
    ],
  },
  {
    category: 'Web Development',
    icon: 'globe',
    items: [
      { name: 'HTML', icon: 'code', description: 'Structuring web pages.' },
      { name: 'CSS', icon: 'palette', description: 'Styling and designing web pages.' },
      { name: 'JavaScript', icon: 'code', description: 'Used in web development coursework.' },
      { name: 'JSP', icon: 'server', description: 'Server-side web development.' },
      { name: 'PHP', icon: 'server', description: 'Server-side development of the AquaLux storefront.' },
      { name: 'Apache Tomcat', icon: 'server', description: 'Running and testing Java web applications.' },
    ],
  },
  {
    category: 'Networking',
    icon: 'network',
    items: [
      { name: 'Cisco Packet Tracer', icon: 'network', description: 'Network simulation, configuring routers and switches, practising network communication.' },
      { name: 'IPv4 Addressing and Subnetting', icon: 'grid', description: 'Networking practical exercises.' },
      { name: 'VLANs', icon: 'layers', description: 'Studied and practised network segmentation.' },
      { name: 'Routing and Switching', icon: 'route', description: 'Studied network configuration and communication.' },
      { name: 'Access Control Lists (ACLs)', icon: 'filter', description: 'Practised network traffic filtering.' },
    ],
  },
  {
    category: 'Cybersecurity',
    icon: 'shield',
    items: [
      { name: 'Cryptography', icon: 'key', description: 'Studied encryption and decryption; applied frequency analysis, Index of Coincidence and crib dragging to classical ciphers in coursework.' },
      { name: 'Network Security', icon: 'shield', description: 'Studied network protection and security configurations.' },
      { name: 'Wireshark', icon: 'radar', description: 'Analysing network traffic and examining packets.' },
      { name: 'SSH', icon: 'lock', description: 'Secure remote access and GitHub-related coursework.' },
    ],
  },
  {
    category: 'Development Tools',
    icon: 'gear',
    items: [
      { name: 'Visual Studio Code', icon: 'code', description: 'Programming and web development.' },
      { name: 'NetBeans', icon: 'code', description: 'Java programming.' },
      { name: 'Git and GitHub', icon: 'branch', description: 'Version control and managing coursework repositories.' },
      { name: 'VMware Workstation', icon: 'monitor', description: 'Running Ubuntu virtual machines.' },
      { name: 'Ubuntu Linux', icon: 'terminal', description: 'Operating systems and administration practical work.' },
      { name: 'Docker', icon: 'box', description: 'Working with containers and MySQL environments.' },
      { name: 'DBeaver', icon: 'database', description: 'Connecting to and managing databases.' },
    ],
  },
];

// Grouped by academic year. `status`: 'completed' | 'current' | 'upcoming'.
// Module descriptions are short summaries of each subject area written from the
// module titles. Check them against your official syllabus and edit if needed.
// `topics` are subject areas covered, not claims of proficiency.
export const journey = [
  {
    year: 'Year 1',
    focus: 'Started April 2025. Foundations in programming, databases, web design, computer systems and security.',
    semesters: [
      {
        semester: 'Semester 1',
        status: 'completed',
        modules: [
          {
            name: 'Programming Techniques 1',
            description: 'Foundations of programming: solving problems and writing structured code.',
            topics: ['Programming fundamentals', 'Problem solving'],
          },
          {
            name: 'Web Design',
            description: 'Designing and building web pages and layouts.',
            topics: ['Web design', 'Front-end basics'],
          },
          {
            name: 'Database Design',
            description: 'Designing databases and structuring data.',
            topics: ['Data modelling', 'Relational databases'],
          },
          {
            name: 'Mathematics for Computer Science',
            description: 'Mathematical foundations used in computing.',
            topics: ['Mathematics for computing'],
          },
          {
            name: 'Professional Communication',
            description: 'Communication skills for professional and technical settings.',
            topics: ['Technical communication'],
          },
        ],
      },
      {
        semester: 'Semester 2',
        status: 'completed',
        modules: [
          {
            name: 'Programming for Machine Learning',
            description: 'Programming used to work with data and introductory machine learning ideas.',
            topics: ['Programming', 'Machine learning basics'],
          },
          {
            name: 'Computer Architecture',
            description: 'How computer hardware is organised and how processors and memory work together.',
            topics: ['Computer hardware', 'Processors and memory'],
          },
          {
            name: 'Operating Systems and Administration',
            description: 'How operating systems manage resources, and the basics of administering them.',
            topics: ['Operating systems', 'System administration'],
          },
          {
            name: 'Data Security and Cryptography',
            description: 'Principles of protecting data, including encryption concepts.',
            topics: ['Data security', 'Cryptography'],
          },
          {
            name: 'Probability and Statistics',
            description: 'Probability and statistical methods for analysing data.',
            topics: ['Probability', 'Statistics'],
          },
          {
            name: 'Cybercrime and Security Fundamentals',
            description: 'Introduction to cybercrime and core information security concepts.',
            topics: ['Cybercrime', 'Security fundamentals'],
          },
        ],
      },
    ],
  },
  {
    year: 'Year 2',
    focus: 'Networking, network security, server-side web programming, and now IoT, mobile and web services.',
    semesters: [
      {
        semester: 'Semester 1',
        status: 'completed',
        modules: [
          {
            name: 'Object-Oriented Programming 2',
            description: 'Further object-oriented programming and the design of larger programs.',
            topics: ['Object-oriented programming'],
          },
          {
            name: 'Switching and Routing Techniques',
            description: 'How network switches and routers move data between devices and networks.',
            topics: ['Switching', 'Routing', 'Networking'],
          },
          {
            name: 'Network Security',
            description: 'Securing networks and understanding the main threats they face.',
            topics: ['Network security'],
          },
          {
            name: 'Server-Side Web Programming',
            description: 'Building the back-end part of web applications that runs on a server.',
            topics: ['Back-end web', 'Server-side programming'],
          },
          {
            name: 'Database-related practical work',
            description: 'Practical work with databases.',
            topics: ['Databases'],
          },
        ],
      },
      {
        semester: 'Semester 2',
        status: 'current',
        modules: [
          {
            name: 'IoT Infrastructure and Application',
            description: 'How Internet of Things systems are built: connected devices, the networks they use and the applications on top.',
            topics: ['Internet of Things', 'Connected devices'],
          },
          {
            name: 'Agile Software Engineering',
            description: 'Agile methods for planning, building and delivering software in teams.',
            topics: ['Agile', 'Software engineering'],
          },
          {
            name: 'Research and Innovation',
            description: 'Research methods and developing new ideas in technology.',
            topics: ['Research methods', 'Innovation'],
          },
          {
            name: 'Cross-Platform Mobile Application',
            description: 'Building mobile applications that run on more than one platform.',
            topics: ['Mobile development', 'Cross-platform'],
          },
          {
            name: 'Web Service Development',
            description: 'Building web services that let applications exchange data, such as APIs.',
            topics: ['Web services', 'APIs'],
          },
        ],
      },
    ],
  },
  {
    year: 'Year 3',
    semesters: [
      { semester: 'Semester 1', status: 'upcoming', modules: [], empty: 'Not started yet.' },
      { semester: 'Semester 2', status: 'upcoming', modules: [], empty: 'Not started yet.' },
    ],
  },
];

export const projectsIntro = {
  title: 'Selected projects',
  text: 'University projects. Group work is marked on each project.',
};

// One entry per project. Optional fields: partner, role, image, github, live.
//   partner: 'Name of your teammate'      -> shows "Built with ..."
//   role:    'What you personally did'    -> shows "My part: ..."
//   image:   '/projects/name.png'         -> screenshot in /public/projects
//   github / live: full URLs
export const projects = [
  {
    title: 'GymPro Manager',
    stack: ['Java', 'Swing', 'JDBC', 'MySQL'],
    context: 'Server-Side Programming',
    team: 'Group project · 2 students',
    description:
      'A desktop gym management system. Member and trainer records with full create, read, update and delete over JDBC, validation on every field, and a tested record layer rather than a demo that only works on the happy path.',
    partner: '',
    role: '',
    image: '',
    github: '',
    live: '',
  },
  {
    title: 'AquaLux',
    stack: ['PHP', 'MySQL'],
    context: 'Server-Side Programming',
    team: 'Group project · 2 students',
    description:
      'An aquarium supplies storefront: product catalogue, cart, checkout, and an admin side for stock. The interesting part was session handling: keeping the cart honest when a user opens three tabs.',
    partner: '',
    role: '',
    image: '',
    github: '',
    live: '',
  },
  {
    title: 'Application of Cryptographic Principles and Cipher Analysis',
    stack: ['Frequency analysis', 'Index of Coincidence', 'Crib dragging'],
    context: 'Data Security and Cryptography',
    team: 'Individual project',
    description:
      'An individual cryptanalysis report with seven questions. I analysed ciphertexts to identify the encryption method and recovered the plaintext for Vigenère, XOR key reuse, transposition and substitution ciphers, then wrote a discussion essay on AI-augmented data security threats.',
    partner: '',
    role: '',
    image: '',
    github: '',
    live: '',
  },
  {
    title: 'Campus network design',
    stack: ['Cisco Packet Tracer'],
    context: 'Switching & Routing',
    team: 'Group project · 2 students',
    description:
      'A segmented campus network: VLANs per department, inter-VLAN routing, trunking, and spanning-tree behaviour under a failed link. Designed, configured and documented against a written requirements brief.',
    partner: '',
    role: '',
    image: '',
    github: '',
    live: '',
  },
];

// Other certificates and participation. Use only what is printed on the certificate.
// Optional `image` adds a "View certificate" button that opens the lightbox.
export const achievements = [
  {
    title: 'Ceramic and Pottery Workshop',
    issuer: 'Rabindranath Tagore Institute',
    date: '22 – 24 November 2023',
    tag: 'Certificate of Participation',
    image: 'certificates/pottery-workshop.jpg',
    link: '',
  },
];

// CV download. Replace public/Surakshit_Kessoonath_CV.pdf with a newer file (same name) to update it.
// Set file to '' to hide the buttons.
export const cv = {
  file: 'Surakshit_Kessoonath_CV.pdf',
  label: 'Download CV',
};

export const contact = {
  intro: 'I am looking for an internship in backend development, software engineering or network security. Get in touch by email or on the platforms below.',
  // Your email address. Powers the "Email me" button (and the form's fallback message).
  // Leave empty to show a PLACEHOLDER button. Example: 'name@example.com'
  email: 'surakshitkessoonath@gmail.com',
  links: [
    { label: 'GitHub', href: 'https://github.com/surakshit2605', display: 'github.com/surakshit2605' },
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/surakshit-kessoonath-157b33252/',
      display: 'linkedin.com/in/surakshit-kessoonath',
    },
    { label: 'Instagram', href: 'https://www.instagram.com/surakshit_05/', display: 'instagram.com/surakshit_05' },
  ],
};

// Atmosphere pictures (not project evidence). Files live in public/visuals/.
export const visuals = {
  laptop: 'visuals/laptop-glow.webp',
  hex: 'visuals/hex-panels.webp',
};

// ---------------------------------------------------------------------------------------------
// Journey map (3D satellite). Edit freely.
//  - cesiumToken: free token from https://cesium.com/ion (Access Tokens). Leave '' to use flat satellite imagery only.
//  - Coordinates are decimal degrees (latitude negative in the south), copied from Google Maps.
//  - Home is an AREA pin (Vallée des Prêtres), not the exact house, on purpose.
// ---------------------------------------------------------------------------------------------
export const journeyMap = {
  cesiumToken: '',
  label: 'Journey Map',
  title: 'From School to University',
  intro: 'A real satellite view of Mauritius: where I started, where I live, and where I am building my future in computer science.',
  start: { year: 2017, month: 1 },
  places: {
    home: {
      id: 'home', tag: 'Starting point', short: 'Home', name: 'Vallée des Prêtres', place: 'Port Louis, Mauritius',
      lat: -20.1654143, lon: 57.5334616,
      text: 'My hometown and my personal base. Everything starts here, and every day of school and university begins and ends here.',
      facts: [['Role', 'Starting point and personal base'], ['Area', 'Vallée des Prêtres, Port Louis']],
    },
    school: {
      id: 'school', tag: 'Where it began', short: 'School', name: 'Sir Abdool Razack Mohamed SSS', place: 'La Poudrière Street, Port Louis',
      lat: -20.1668136, lon: 57.5056846,
      from: { y: 2017, m: 1 }, to: { y: 2024, m: 12 }, years: '2017 – 2024',
      photo: 'journey/school.webp', photoAlt: 'Entrance of Sir Abdool Razack Mohamed State Secondary School',
      text: 'My previous school, and where my academic journey began. My early studies and first steps in education happened here.',
      facts: [['Years', '2017 – 2024'], ['Type', 'State secondary school']],
    },
    uni: {
      id: 'uni', tag: 'Where I am building my future', short: 'University', name: 'University of Technology, Mauritius (UTM)', place: 'La Tour Koenig, Pointe aux Sables',
      lat: -20.1769432, lon: 57.4670199,
      from: { y: 2025, m: 4 }, to: { y: 2028, m: 4 }, years: 'April 2025 – April 2028',
      photo: 'journey/uni.webp', photoAlt: 'Central administration building at the University of Technology, Mauritius',
      text: 'Where I am studying today and building my future in computer science and network security.',
      facts: [['Degree', 'BSc Computer Science – Network Security'], ['Started', 'April 2025'], ['Expected completion', 'April 2028']],
    },
  },
};
