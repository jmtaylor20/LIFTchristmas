// Family-facing text in English and Spanish. Everything a parent sees (the
// application, their family page, and their emails) comes from here.
// Have a native speaker review the Spanish before launch.

export type Lang = "en" | "es";

export function toLang(value: string | null | undefined): Lang {
  return value === "es" ? "es" : "en";
}

const en = {
  switchTo: "Español",
  switchLang: "es" as Lang,
  christmas: (year: number | string) => `Christmas ${year}`,

  apply: {
    title: "Holiday Assistance Application",
    intro: (communities: string) =>
      `Lift Ministries Community Christmas is here to help families in our community (${communities}) during the holiday season. If you are in need of assistance this year, please complete the application below. One application per household.`,
    closes: "All applications are due by",
    alreadyApplied: "Already applied? Use the private link we emailed you, or",
    getLinkAgain: "get your link again",
    closedTitle: "Applications are closed",
    closedNoSeason: "Applications haven't opened yet.",
    closedEnded: "The application period for this season has ended.",
    closedCheck: "If you have already applied, you can",
    checkStatus: "check your status here",
  },

  form: {
    parent: "Parent or guardian",
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone",
    email: "Email",
    emailHint: "We'll send your private link and updates here.",
    address: "Street address",
    city: "City",
    zip: "ZIP",
    choose: "Choose…",
    optional: "Optional",
    work: "Work and help",
    hasJobQ: "Do you currently have a job?",
    lookingQ: "Are you actively looking for work?",
    income: "Total household income per year",
    incomeAmountHint: "Before taxes, for everyone in your home. An estimate is fine.",
    docsHint: "We need both before we can approve your application. Don't have them handy? You can add them later from your family page.",
    photoIdShort: "Photo ID (driver's license or state ID)",
    incomeProofShort: "Proof of income (most recent pay stub or benefits letter)",
    employer: "Job / employer name",
    employerHint: "Not working? Write “Not employed”, “Disabled”, or “Stay-at-home parent”.",
    jobLength: "How long have you worked at this job?",
    priorHelpQ: "Have you received help from Community Christmas before?",
    yes: "Yes",
    no: "No",
    priorYears: "If yes, which years and how many total years?",
    agencyQ: "Are you currently receiving help from another agency?",
    agencyNames: "If yes, list the agency names",
    documents: "Documents",
    documentsIntro: "Take a picture with your phone or upload a file (photo or PDF). Only the ministry team can see these.",
    photoId: "1. Driver's license / state photo ID",
    incomeProof: "2. Most recent pay stub / income proof",
    incomeHint: "No pay stub? Upload a benefits letter or other proof of income.",
    children: "Children",
    childrenIntro: "List each child living in your home (up to 5), with up to 5 wish-list items for each.",
    child: (n: number) => `Child ${n}`,
    remove: "Remove",
    age: "Age",
    agePh: "e.g. 7, or 6 months",
    boyOrGirl: "Boy or girl",
    girl: "Girl",
    boy: "Boy",
    childWord: "Child",
    clothing: "Clothing size",
    shoe: "Shoe size",
    race: "Child's race",
    wishList: "Wish list items (up to 5)",
    wishPh: (n: number) => `Item ${n}`,
    addChild: "+ Add another child",
    agreementTitle: "Parent / guardian agreement",
    agree:
      "I confirm the information above is true, this is the only application for my household this year, and I understand gifts must be picked up at the time and place the ministry provides.",
    agreeCheck: "I have read, understand, and agree to the statements in the Parent/Guardian Agreement above.",
    printedName: "Parent / guardian printed name",
    signature: "Digital signature (type your full name)",
    signatureHint: "By typing your name, you are electronically signing this application.",
    submit: "Submit application",
    submitting: "Submitting…",
  },

  errors: {
    closed: "Applications are closed for this season.",
    parent: "Please fill in all of the parent/guardian fields.",
    phone: "Please enter a 10-digit phone number.",
    email: "Please enter a valid email address.",
    work: "Please answer the job and help questions.",
    income: "Please enter your household's total yearly income.",
    docs: "Please add your photo ID and proof of income.",
    docType: "Each document must be a photo or a PDF under 3 MB.",
    agree: "Please check the agreement box.",
    signature: "Please type your printed name and signature.",
    noChildren: "Please add at least one child.",
    tooMany: "Please list no more than 5 children.",
    child: "Please give the name, age, and boy/girl for every child.",
    age: (name: string) => `${name} must be 18 or younger.`,
    sizes: (name: string) => `Please choose a clothing size and a shoe size for ${name}.`,
    duplicate:
      "We already have an application for your household this season. Use the private link in your email to check on it, or use “get your link again” at the top of this page.",
  },

  thanks: {
    eyebrow: "Thank you",
    title: "We received your application",
    intro: "Our team will prayerfully review it and email you when a decision has been made.",
    body: "We emailed you a private link to your family's Christmas page. Once you're approved, you can review each child's wish list there.",
    bookmark: "You can also bookmark it now:",
    go: "Go to my family's page",
    approvedTitle: "Good news: you're approved!",
    approvedIntro: "Your family has been approved for Christmas sponsorship. We emailed you the details.",
    approvedBody: "Your family's page has your children's wish lists and gift pickup details.",
    needInfoTitle: "Almost done",
    needInfoIntro: "We received your application. Before we can approve it, we need your documents.",
    needInfoBody: "Open your family's page to add them. We also emailed you a link.",
  },

  lookup: {
    eyebrow: "Families",
    title: "Get your private link again",
    intro: "Enter the email or phone number you applied with and we'll email your family's link.",
    field: "Email or phone number",
    button: "Email me my link",
    sent: "If we found an application for this season, we just emailed the link to the address on file. Please check your inbox (and spam folder).",
  },

  family: {
    title: (last: string) => `The ${last} family`,
    status: "Status",
    statusApprovedDone: "Approved · wish lists submitted",
    statusApprovedTodo: "Approved · please make your wish lists",
    statusPending: "Application received · under review",
    statusWaitlist: "On the waiting list",
    statusDenied: "Not approved this year",
    pending: (email: string) =>
      `Thank you for applying! Our team is reviewing applications now. We'll email ${email} when a decision is made. You can come back to this page any time.`,
    needInfoTitle: "We need a little more information",
    needInfoBody: "Before we can approve your application, please add:",
    needInfoUpload: "Send",
    needInfoSaved: "Thank you! We received your documents.",
    pendingNoEmail:
      "Thank you for applying! Our team is reviewing applications now. We'll call or text you when a decision is made. You can come back to this page any time.",
    addEmailTitle: "Get updates by email",
    addEmailBody: "Add your email and we'll send you this page's link, plus updates about your application, wish lists, and gift pickup.",
    addEmailButton: "Save my email",
    emailSaved: "Thank you! We emailed you this page's link, and we'll send updates there.",
    emailInvalid: "Please enter a valid email address.",
    smsPickup: (first: string, details: string) =>
      `Hi ${first}, this is LIFT Community Christmas with a reminder about gift pickup.\n\n${details}`,
    smsText: (first: string, link: string) =>
      `Hi ${first}, this is LIFT Community Christmas. Here is your family's private Christmas page, where you can check your status, see your children's wish lists, and find pickup details: ${link} Please save this link and don't share it.`,
    waitlist: "Your application is on our waiting list. We'll contact you if a spot opens up. Thank you for your patience.",
    denied: "We're sorry, we aren't able to sponsor your family this year. If you have questions, please email",
    approved: "Good news: you're approved!",
    approvedHow: (max: number) => `Please add up to ${max} wish-list items for each child, then press “Submit wish lists” at the bottom.`,
    listsDue: "Lists are due by",
    submittedOn: (date: string) => `Your wish lists were submitted on ${date}. Your children are on our Angel Tree.`,
    needChange: "Need to change something? Email",
    pastDeadline: "The wish-list deadline has passed. Please contact us if you need help.",
    emptyError: "Every child needs at least one item before you submit.",
    pickup: "Gift pickup",
    pickedUp: (date: string) => `Gifts picked up ${date}. Merry Christmas!`,
    ageLine: (gender: string, age: number) => (age < 1 ? `${gender}, under 1` : `${gender}, age ${age}`),
    shirt: "Clothing",
    pants: "Pants",
    shoes: "Shoes",
    interests: "Interests",
    loves: "Loves",
    saveSizes: "Save sizes & interests",
    wishList: "Wish list",
    noItems: "No items yet.",
    about: (price: string) => `about ${price}`,
    item: "Item",
    itemPh: "Gift",
    details: "Size / color / details",
    detailsPh: "Youth L, blue",
    price: "About how much?",
    link: "Link (optional)",
    addItem: "+ Add item",
    submitText:
      "When every child's list is ready, submit it. Your children will appear on our Angel Tree by angel number, age, and wish list only. We never show names publicly. You won't be able to change lists after this.",
    submit: "Submit wish lists",
  },

  thankYou: {
    title: "Say thank you",
    intro:
      "Would you like to thank the people who sponsored your children? Write a note, or snap a photo of a card or drawing your child made. Our team reads each note before passing it along, so please use first names only.",
    to: "Who is it from?",
    wholeFamily: "Our whole family",
    fromChild: (name: string) => `From ${name}`,
    message: "Your message",
    messagePh: "Thank you so much for…",
    photo: "Photo of a card or drawing (optional)",
    send: "Send thank-you",
    sending: "Sending…",
    sent: "Thank you! We'll pass your note along to your sponsors.",
    yours: "Your notes",
    waiting: "Waiting for review",
    delivered: "Delivered to sponsors",
    held: "Kept by the ministry",
    errEmpty: "Please write a message.",
    errPhoto: "That photo couldn't be used. Please try a JPG or PNG under 4 MB.",
    errClosed: "Thank-you notes open after your wish lists are submitted.",
  },
  email: {
    receivedSubject: (site: string) => `We received your application — ${site}`,
    received: (first: string, button: string, site: string) => `<p>Hi ${first},</p>
<p>Thank you for applying for Christmas sponsorship. Our team will review your application and email you when a decision is made.</p>
<p>Save this private link. You'll use it to check your status and, once approved, to make your children's wish lists:</p>
${button}
<p style="font-size:13px;color:#666">Please don't share this link. It's how we know it's you.</p>
<p>Praying for you and your family,<br/>${site}</p>`,
    pageButton: "My family's Christmas page",
    linkSubject: (site: string) => `Your family's Christmas page — ${site}`,
    link: (first: string, button: string) => `<p>Hi ${first},</p><p>Here is your private link:</p>${button}`,
    approvedSubject: "You're approved! Next step: wish lists",
    approved: (first: string, due: string | null, extra: string, button: string, pickup: string, site: string) => `<p>Hi ${first},</p>
<p><strong>Good news: your family has been approved for Christmas sponsorship!</strong></p>
<p>Next, please make a wish list for each of your children using your family's page below${due ? ` by <strong>${due}</strong>` : ""}.</p>
${extra}${button}${pickup ? `<p><strong>Gift pickup:</strong> ${pickup}</p>` : ""}
<p>Merry Christmas,<br/>${site}</p>`,
    approvedButton: "Make our wish lists",
    needInfoSubject: "Please finish your Christmas application",
    needInfo: (first: string, list: string, button: string, site: string) => `<p>Hi ${first},</p>
<p>Thank you for applying for Christmas sponsorship! Before we can approve your application, we need:</p>
${list}
<p>You can add them from your family's page. Take a picture with your phone or upload a file.</p>
${button}
<p>Merry Christmas,<br/>${site}</p>`,
    needInfoButton: "Finish my application",
    approvedListsInSubject: "You're approved for Christmas sponsorship!",
    approvedListsIn: (first: string, extra: string, button: string, pickup: string, site: string, contact: string) => `<p>Hi ${first},</p>
<p><strong>Good news: your family has been approved for Christmas sponsorship!</strong></p>
<p>Your children's wish lists from your application are now on our Angel Tree. If something needs to change, please email ${contact}.</p>
${extra}${button}${pickup ? `<p><strong>Gift pickup:</strong> ${pickup}</p>` : ""}
<p>Merry Christmas,<br/>${site}</p>`,
    decisionSubject: "Your Christmas sponsorship application",
    waitlist: (first: string, extra: string, button: string) => `<p>Hi ${first},</p>
<p>Thank you for applying. Your family has been placed on our waiting list. We'll contact you if a spot opens.</p>${extra}${button}`,
    statusButton: "Check my status",
    denied: (first: string, extra: string) => `<p>Hi ${first},</p>
<p>Thank you for applying. We're sorry, but we are unable to sponsor your family this year.</p>${extra}
<p>We'll be praying for you and your family this Christmas season.</p>`,
    pickupSubject: "Reminder: Christmas gift pickup",
    pickup: (first: string, details: string, button: string) => `<p>Hi ${first},</p>
<p>This is a friendly reminder about picking up your children's Christmas gifts.</p>
<p>${details}</p>
${button}
<p>Merry Christmas!</p>`,
    reminderSubject: "Reminder: please finish your children's wish lists",
    reminder: (first: string, due: string, button: string) => `<p>Hi ${first},</p>
<p>This is a friendly reminder to finish and submit your children's Christmas wish lists by <strong>${due}</strong>. Sponsors can't choose your children until their lists are submitted.</p>
${button}`,
  },
};

type Dict = typeof en;

const es: Dict = {
  switchTo: "English",
  switchLang: "en",
  christmas: (year) => `Navidad ${year}`,

  apply: {
    title: "Solicitud de Ayuda Navideña",
    intro: (communities) =>
      `Lift Ministries Community Christmas está aquí para ayudar a las familias de nuestra comunidad (${communities}) durante la temporada navideña. Si necesita ayuda este año, por favor complete la solicitud a continuación. Una solicitud por hogar.`,
    closes: "Todas las solicitudes vencen el",
    alreadyApplied: "¿Ya presentó su solicitud? Use el enlace privado que le enviamos por correo, o",
    getLinkAgain: "reciba su enlace otra vez",
    closedTitle: "Las solicitudes están cerradas",
    closedNoSeason: "Las solicitudes aún no están abiertas.",
    closedEnded: "El periodo de solicitudes de esta temporada ya terminó.",
    closedCheck: "Si ya presentó su solicitud, puede",
    checkStatus: "ver su estado aquí",
  },

  form: {
    parent: "Padre, madre o tutor",
    firstName: "Nombre",
    lastName: "Apellido",
    phone: "Teléfono",
    email: "Correo electrónico",
    emailHint: "Aquí le enviaremos su enlace privado y novedades.",
    address: "Dirección",
    city: "Ciudad",
    zip: "Código postal",
    choose: "Elija…",
    optional: "Opcional",
    work: "Trabajo y ayuda",
    hasJobQ: "¿Tiene trabajo actualmente?",
    lookingQ: "¿Está buscando trabajo activamente?",
    income: "Ingreso total del hogar por año",
    incomeAmountHint: "Antes de impuestos, de todas las personas en su hogar. Un cálculo aproximado está bien.",
    docsHint: "Necesitamos los dos antes de aprobar su solicitud. ¿No los tiene a la mano? Puede agregarlos después desde la página de su familia.",
    photoIdShort: "Identificación con foto (licencia de conducir o identificación estatal)",
    incomeProofShort: "Comprobante de ingresos (talón de pago más reciente o carta de beneficios)",
    employer: "Trabajo / nombre del empleador",
    employerHint: "¿No trabaja? Escriba “Sin empleo”, “Discapacidad” o “En casa con mis hijos”.",
    jobLength: "¿Cuánto tiempo lleva en este trabajo?",
    priorHelpQ: "¿Ha recibido ayuda de Community Christmas antes?",
    yes: "Sí",
    no: "No",
    priorYears: "Si es así, ¿en qué años y cuántos años en total?",
    agencyQ: "¿Recibe ayuda de otra agencia actualmente?",
    agencyNames: "Si es así, escriba el nombre de las agencias",
    documents: "Documentos",
    documentsIntro: "Tome una foto con su teléfono o suba un archivo (foto o PDF). Solo el equipo del ministerio puede verlos.",
    photoId: "1. Licencia de conducir / identificación estatal con foto",
    incomeProof: "2. Talón de pago más reciente / comprobante de ingresos",
    incomeHint: "¿No tiene talón de pago? Suba una carta de beneficios u otro comprobante de ingresos.",
    children: "Niños",
    childrenIntro: "Anote a cada niño que vive en su hogar (hasta 5), con hasta 5 regalos en la lista de deseos de cada uno.",
    child: (n) => `Niño ${n}`,
    remove: "Quitar",
    age: "Edad",
    agePh: "p. ej. 7, o 6 meses",
    boyOrGirl: "Niño o niña",
    girl: "Niña",
    boy: "Niño",
    childWord: "Niño(a)",
    clothing: "Talla de ropa",
    shoe: "Talla de zapato",
    race: "Raza del niño",
    wishList: "Lista de deseos (hasta 5)",
    wishPh: (n) => `Regalo ${n}`,
    addChild: "+ Agregar otro niño",
    agreementTitle: "Acuerdo del padre, madre o tutor",
    agree:
      "Confirmo que la información es verdadera, que esta es la única solicitud de mi hogar este año, y entiendo que los regalos se deben recoger en el lugar y la hora que indique el ministerio.",
    agreeCheck: "He leído, entiendo y acepto lo indicado en el Acuerdo del padre, madre o tutor.",
    printedName: "Nombre del padre, madre o tutor (en letra de molde)",
    signature: "Firma digital (escriba su nombre completo)",
    signatureHint: "Al escribir su nombre, usted firma esta solicitud electrónicamente.",
    submit: "Enviar solicitud",
    submitting: "Enviando…",
  },

  errors: {
    closed: "Las solicitudes están cerradas para esta temporada.",
    parent: "Por favor complete todos los datos del padre, madre o tutor.",
    phone: "Por favor escriba un número de teléfono de 10 dígitos.",
    email: "Por favor escriba un correo electrónico válido.",
    work: "Por favor conteste las preguntas sobre su trabajo y la ayuda que recibe.",
    income: "Por favor escriba el ingreso total de su hogar por año.",
    docs: "Por favor agregue su identificación con foto y su comprobante de ingresos.",
    docType: "Cada documento debe ser una foto o un PDF de menos de 3 MB.",
    agree: "Por favor marque la casilla del acuerdo.",
    signature: "Por favor escriba su nombre y su firma.",
    noChildren: "Por favor agregue al menos un niño.",
    tooMany: "Por favor anote 5 niños como máximo.",
    child: "Por favor escriba el nombre, la edad y si es niño o niña para cada uno.",
    age: (name) => `${name} debe tener 18 años o menos.`,
    sizes: (name) => `Por favor elija una talla de ropa y una talla de zapato para ${name}.`,
    duplicate:
      "Ya tenemos una solicitud de su hogar para esta temporada. Use el enlace privado de su correo para verla, o use “reciba su enlace otra vez” arriba en esta página.",
  },

  thanks: {
    eyebrow: "Gracias",
    title: "Recibimos su solicitud",
    intro: "Nuestro equipo la revisará en oración y le enviaremos un correo cuando se tome una decisión.",
    body: "Le enviamos por correo un enlace privado a la página navideña de su familia. Cuando sea aprobado, podrá revisar ahí la lista de deseos de cada niño.",
    bookmark: "También puede guardarla ahora:",
    go: "Ir a la página de mi familia",
    approvedTitle: "¡Buenas noticias: fue aprobado!",
    approvedIntro: "Su familia fue aprobada para el patrocinio navideño. Le enviamos los detalles por correo.",
    approvedBody: "La página de su familia tiene las listas de deseos de sus niños y los detalles para recoger los regalos.",
    needInfoTitle: "Ya casi termina",
    needInfoIntro: "Recibimos su solicitud. Antes de aprobarla, necesitamos sus documentos.",
    needInfoBody: "Abra la página de su familia para agregarlos. También le enviamos un enlace por correo.",
  },

  lookup: {
    eyebrow: "Familias",
    title: "Reciba su enlace privado otra vez",
    intro: "Escriba el correo o teléfono que usó en su solicitud y le enviaremos el enlace de su familia.",
    field: "Correo electrónico o teléfono",
    button: "Enviarme mi enlace",
    sent: "Si encontramos una solicitud para esta temporada, acabamos de enviar el enlace al correo registrado. Revise su bandeja de entrada (y la carpeta de spam).",
  },

  family: {
    title: (last) => `Familia ${last}`,
    status: "Estado",
    statusApprovedDone: "Aprobada · listas enviadas",
    statusApprovedTodo: "Aprobada · por favor haga sus listas de deseos",
    statusPending: "Solicitud recibida · en revisión",
    statusWaitlist: "En la lista de espera",
    statusDenied: "No aprobada este año",
    pending: (email) =>
      `¡Gracias por su solicitud! Nuestro equipo está revisando las solicitudes. Le escribiremos a ${email} cuando se tome una decisión. Puede volver a esta página cuando quiera.`,
    needInfoTitle: "Necesitamos un poco más de información",
    needInfoBody: "Antes de aprobar su solicitud, por favor agregue:",
    needInfoUpload: "Enviar",
    needInfoSaved: "¡Gracias! Recibimos sus documentos.",
    pendingNoEmail:
      "¡Gracias por su solicitud! Nuestro equipo está revisando las solicitudes. Le llamaremos o le enviaremos un mensaje de texto cuando se tome una decisión. Puede volver a esta página cuando quiera.",
    addEmailTitle: "Reciba novedades por correo",
    addEmailBody: "Agregue su correo y le enviaremos el enlace de esta página, además de novedades sobre su solicitud, las listas de deseos y la entrega de regalos.",
    addEmailButton: "Guardar mi correo",
    emailSaved: "¡Gracias! Le enviamos el enlace de esta página por correo, y ahí le mandaremos las novedades.",
    emailInvalid: "Por favor escriba un correo electrónico válido.",
    smsPickup: (first, details) => `Hola ${first}, le escribe LIFT Community Christmas para recordarle la entrega de regalos.\n\n${details}`,
    smsText: (first, link) =>
      `Hola ${first}, le escribe LIFT Community Christmas. Esta es la página navideña privada de su familia, donde puede ver el estado de su solicitud, las listas de deseos de sus niños y los detalles para recoger los regalos: ${link} Guarde este enlace y no lo comparta.`,
    waitlist: "Su solicitud está en nuestra lista de espera. Le avisaremos si se abre un lugar. Gracias por su paciencia.",
    denied: "Lo sentimos, este año no podemos patrocinar a su familia. Si tiene preguntas, escriba a",
    approved: "¡Buenas noticias: su familia fue aprobada!",
    approvedHow: (max) =>
      `Agregue hasta ${max} regalos a la lista de cada niño y luego presione “Enviar listas de deseos” al final de la página.`,
    listsDue: "Las listas se deben enviar a más tardar el",
    submittedOn: (date) => `Sus listas de deseos se enviaron el ${date}. Sus niños ya están en nuestro Árbol de Ángeles.`,
    needChange: "¿Necesita cambiar algo? Escriba a",
    pastDeadline: "La fecha límite para las listas ya pasó. Comuníquese con nosotros si necesita ayuda.",
    emptyError: "Cada niño necesita al menos un regalo en su lista antes de enviar.",
    pickup: "Entrega de regalos",
    pickedUp: (date) => `Regalos recogidos el ${date}. ¡Feliz Navidad!`,
    ageLine: (gender, age) => (age < 1 ? `${gender}, menos de 1 año` : `${gender}, ${age} años`),
    shirt: "Ropa",
    pants: "Pantalón",
    shoes: "Zapatos",
    interests: "Intereses",
    loves: "Le encanta",
    saveSizes: "Guardar tallas e intereses",
    wishList: "Lista de deseos",
    noItems: "Todavía no hay regalos.",
    about: (price) => `aprox. ${price}`,
    item: "Regalo",
    itemPh: "Regalo",
    details: "Talla / color / detalles",
    detailsPh: "Talla L juvenil, azul",
    price: "¿Cuánto cuesta más o menos?",
    link: "Enlace (opcional)",
    addItem: "+ Agregar regalo",
    submitText:
      "Cuando la lista de cada niño esté lista, envíela. Sus niños aparecerán en nuestro Árbol de Ángeles solo con su número de ángel, edad y lista de deseos. Nunca mostramos nombres. Después de enviar no podrá cambiar las listas.",
    submit: "Enviar listas de deseos",
  },

  thankYou: {
    title: "Dar las gracias",
    intro:
      "¿Le gustaría agradecer a las personas que patrocinaron a sus niños? Escriba una nota, o tome una foto de una tarjeta o dibujo que hizo su niño. Nuestro equipo lee cada nota antes de entregarla, así que por favor use solo nombres de pila.",
    to: "¿De parte de quién?",
    wholeFamily: "De toda la familia",
    fromChild: (name) => `De ${name}`,
    message: "Su mensaje",
    messagePh: "Muchas gracias por…",
    photo: "Foto de una tarjeta o dibujo (opcional)",
    send: "Enviar agradecimiento",
    sending: "Enviando…",
    sent: "¡Gracias! Le haremos llegar su nota a sus patrocinadores.",
    yours: "Sus notas",
    waiting: "En revisión",
    delivered: "Entregada a los patrocinadores",
    held: "Guardada por el ministerio",
    errEmpty: "Por favor escriba un mensaje.",
    errPhoto: "No pudimos usar esa foto. Intente con una JPG o PNG de menos de 4 MB.",
    errClosed: "Las notas de agradecimiento se abren después de enviar sus listas de deseos.",
  },
  email: {
    receivedSubject: (site) => `Recibimos su solicitud — ${site}`,
    received: (first, button, site) => `<p>Hola ${first}:</p>
<p>Gracias por solicitar el patrocinio navideño. Nuestro equipo revisará su solicitud y le escribiremos cuando se tome una decisión.</p>
<p>Guarde este enlace privado. Lo usará para ver su estado y, cuando sea aprobado, para hacer las listas de deseos de sus niños:</p>
${button}
<p style="font-size:13px;color:#666">Por favor no comparta este enlace. Así sabemos que es usted.</p>
<p>Orando por usted y su familia,<br/>${site}</p>`,
    pageButton: "Página navideña de mi familia",
    linkSubject: (site) => `La página navideña de su familia — ${site}`,
    link: (first, button) => `<p>Hola ${first}:</p><p>Aquí está su enlace privado:</p>${button}`,
    approvedSubject: "¡Fue aprobado! Siguiente paso: listas de deseos",
    approved: (first, due, extra, button, pickup, site) => `<p>Hola ${first}:</p>
<p><strong>¡Buenas noticias: su familia fue aprobada para el patrocinio navideño!</strong></p>
<p>Ahora, por favor haga una lista de deseos para cada uno de sus niños en la página de su familia${due ? ` a más tardar el <strong>${due}</strong>` : ""}.</p>
${extra}${button}${pickup ? `<p><strong>Entrega de regalos:</strong> ${pickup}</p>` : ""}
<p>Feliz Navidad,<br/>${site}</p>`,
    approvedButton: "Hacer nuestras listas de deseos",
    needInfoSubject: "Por favor termine su solicitud de Navidad",
    needInfo: (first, list, button, site) => `<p>Hola ${first}:</p>
<p>¡Gracias por su solicitud de patrocinio navideño! Antes de aprobarla, necesitamos:</p>
${list}
<p>Puede agregarlos desde la página de su familia. Tome una foto con su teléfono o suba un archivo.</p>
${button}
<p>Feliz Navidad,<br/>${site}</p>`,
    needInfoButton: "Terminar mi solicitud",
    approvedListsInSubject: "¡Su familia fue aprobada para el patrocinio navideño!",
    approvedListsIn: (first, extra, button, pickup, site, contact) => `<p>Hola ${first}:</p>
<p><strong>¡Buenas noticias: su familia fue aprobada para el patrocinio navideño!</strong></p>
<p>Las listas de deseos de sus niños que puso en su solicitud ya están en nuestro Árbol de Ángeles. Si necesita cambiar algo, escriba a ${contact}.</p>
${extra}${button}${pickup ? `<p><strong>Entrega de regalos:</strong> ${pickup}</p>` : ""}
<p>Feliz Navidad,<br/>${site}</p>`,
    decisionSubject: "Su solicitud de patrocinio navideño",
    waitlist: (first, extra, button) => `<p>Hola ${first}:</p>
<p>Gracias por su solicitud. Su familia está en nuestra lista de espera. Le avisaremos si se abre un lugar.</p>${extra}${button}`,
    statusButton: "Ver mi estado",
    denied: (first, extra) => `<p>Hola ${first}:</p>
<p>Gracias por su solicitud. Lo sentimos, pero este año no podemos patrocinar a su familia.</p>${extra}
<p>Estaremos orando por usted y su familia en esta Navidad.</p>`,
    pickupSubject: "Recordatorio: entrega de regalos de Navidad",
    pickup: (first, details, button) => `<p>Hola ${first}:</p>
<p>Le recordamos los detalles para recoger los regalos de Navidad de sus niños.</p>
<p>${details}</p>
${button}
<p>¡Feliz Navidad!</p>`,
    reminderSubject: "Recordatorio: por favor termine las listas de deseos de sus niños",
    reminder: (first, due, button) => `<p>Hola ${first}:</p>
<p>Le recordamos terminar y enviar las listas de deseos navideñas de sus niños a más tardar el <strong>${due}</strong>. Los patrocinadores no pueden elegir a sus niños hasta que las listas se envíen.</p>
${button}`,
  },
};

export const dict: Record<Lang, Dict> = { en, es };

/** Long date in the family's language, US Central time. */
export function longDate(d: Date, lang: Lang) {
  return d.toLocaleDateString(lang === "es" ? "es-US" : "en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Chicago",
  });
}
