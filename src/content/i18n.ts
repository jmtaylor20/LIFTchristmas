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
    community: "Community",
    choose: "Choose…",
    otherArea: "Other nearby area",
    adults: "Adults living in the home",
    household: "Household situation",
    income: "Approximate monthly household income",
    incomeHint: "Optional, but it helps us review.",
    assistanceQ: "Does your household receive any of these?",
    assistance: ["SNAP / food stamps", "WIC", "Medicaid / ALL Kids", "Housing assistance", "SSI / disability", "Unemployment"],
    need: "Tell us about your family's need this Christmas",
    needHint: "Job loss, illness, a new baby, a hard year. Anything you'd like us to know. Everything you share is kept private.",
    church: "Church home",
    heard: "How did you hear about us?",
    optional: "Optional",
    children: "Children",
    childrenIntro: "List each child (17 and under) living in your home. You'll make each child's wish list after you're approved.",
    child: (n: number) => `Child ${n}`,
    remove: "Remove",
    birthDate: "Birth date",
    boyOrGirl: "Boy or girl",
    girl: "Girl",
    boy: "Boy",
    shirt: "Shirt size",
    pants: "Pants size",
    shoe: "Shoe size",
    interests: "Interests / favorite things",
    interestsPh: "Dinosaurs, art, football…",
    addChild: "+ Add another child",
    agree:
      "I confirm the information above is true, this is the only application for my household this year, and I understand gifts must be picked up at the time and place the ministry provides.",
    submit: "Submit application",
    submitting: "Submitting…",
  },

  errors: {
    closed: "Applications are closed for this season.",
    parent: "Please fill in all of the parent/guardian fields.",
    phone: "Please enter a 10-digit phone number.",
    email: "Please enter a valid email address.",
    need: "Please tell us a little about your family's need.",
    agree: "Please check the confirmation box.",
    noChildren: "Please add at least one child.",
    child: "Please complete the name, birth date, and boy/girl for every child.",
    age: (name: string) => `${name} must be 17 or younger on Christmas Day.`,
    duplicate:
      "We already have an application for your household this season. Use the private link in your email to check on it, or use “get your link again” at the top of this page.",
  },

  thanks: {
    eyebrow: "Thank you",
    title: "We received your application",
    intro: "Our team will prayerfully review it and email you when a decision has been made.",
    body: "We emailed you a private link to your family's Christmas page. Once you're approved, you'll use that page to make a wish list for each child.",
    bookmark: "You can also bookmark it now:",
    go: "Go to my family's page",
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
    waitlist: "Your application is on our waiting list. We'll contact you if a spot opens up. Thank you for your patience.",
    denied: "We're sorry, we aren't able to sponsor your family this year. If you have questions, please email",
    approved: "Good news: you're approved!",
    approvedHow: (max: number) => `Please add up to ${max} wish-list items for each child, then press “Submit wish lists” at the bottom.`,
    listsDue: "Lists are due by",
    tip: (budget: string) =>
      `Tip: a sponsor usually spends about ${budget} per child. Include a mix of needs (clothes, shoes, coats) and wants, and add a few lower-priced items.`,
    submittedOn: (date: string) => `Your wish lists were submitted on ${date}. Your children are on our Angel Tree.`,
    needChange: "Need to change something? Email",
    pastDeadline: "The wish-list deadline has passed. Please contact us if you need help.",
    emptyError: "Every child needs at least one item before you submit.",
    pickup: "Gift pickup",
    pickedUp: (date: string) => `Gifts picked up ${date}. Merry Christmas!`,
    ageLine: (gender: string, age: number) => `${gender}, age ${age}`,
    shirt: "Shirt",
    pants: "Pants",
    shoes: "Shoes",
    interests: "Interests",
    loves: "Loves",
    saveSizes: "Save sizes & interests",
    wishList: "Wish list",
    noItems: "No items yet.",
    about: (price: string) => `about ${price}`,
    item: "Item",
    itemPh: "e.g. Winter coat",
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
    decisionSubject: "Your Christmas sponsorship application",
    waitlist: (first: string, extra: string, button: string) => `<p>Hi ${first},</p>
<p>Thank you for applying. Your family has been placed on our waiting list. We'll contact you if a spot opens.</p>${extra}${button}`,
    statusButton: "Check my status",
    denied: (first: string, extra: string) => `<p>Hi ${first},</p>
<p>Thank you for applying. We're sorry, but we are unable to sponsor your family this year.</p>${extra}
<p>We'll be praying for you and your family this Christmas season.</p>`,
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
    community: "Comunidad",
    choose: "Elija…",
    otherArea: "Otra zona cercana",
    adults: "Adultos que viven en el hogar",
    household: "Situación del hogar",
    income: "Ingreso mensual aproximado del hogar",
    incomeHint: "Opcional, pero nos ayuda a revisar su solicitud.",
    assistanceQ: "¿Su hogar recibe alguno de estos beneficios?",
    assistance: ["SNAP / cupones de alimentos", "WIC", "Medicaid / ALL Kids", "Ayuda de vivienda", "SSI / discapacidad", "Desempleo"],
    need: "Cuéntenos sobre la necesidad de su familia esta Navidad",
    needHint: "Pérdida de trabajo, enfermedad, un bebé nuevo, un año difícil. Todo lo que comparta se mantiene en privado.",
    church: "Iglesia a la que asiste",
    heard: "¿Cómo se enteró de nosotros?",
    optional: "Opcional",
    children: "Niños",
    childrenIntro:
      "Anote a cada niño (de 17 años o menos) que vive en su hogar. Hará la lista de deseos de cada niño después de ser aprobado.",
    child: (n) => `Niño ${n}`,
    remove: "Quitar",
    birthDate: "Fecha de nacimiento",
    boyOrGirl: "Niño o niña",
    girl: "Niña",
    boy: "Niño",
    shirt: "Talla de camisa",
    pants: "Talla de pantalón",
    shoe: "Talla de zapato",
    interests: "Intereses / cosas favoritas",
    interestsPh: "Dinosaurios, arte, fútbol…",
    addChild: "+ Agregar otro niño",
    agree:
      "Confirmo que la información es verdadera, que esta es la única solicitud de mi hogar este año, y entiendo que los regalos se deben recoger en el lugar y la hora que indique el ministerio.",
    submit: "Enviar solicitud",
    submitting: "Enviando…",
  },

  errors: {
    closed: "Las solicitudes están cerradas para esta temporada.",
    parent: "Por favor complete todos los datos del padre, madre o tutor.",
    phone: "Por favor escriba un número de teléfono de 10 dígitos.",
    email: "Por favor escriba un correo electrónico válido.",
    need: "Por favor cuéntenos un poco sobre la necesidad de su familia.",
    agree: "Por favor marque la casilla de confirmación.",
    noChildren: "Por favor agregue al menos un niño.",
    child: "Por favor complete el nombre, la fecha de nacimiento y si es niño o niña para cada uno.",
    age: (name) => `${name} debe tener 17 años o menos el día de Navidad.`,
    duplicate:
      "Ya tenemos una solicitud de su hogar para esta temporada. Use el enlace privado de su correo para verla, o use “reciba su enlace otra vez” arriba en esta página.",
  },

  thanks: {
    eyebrow: "Gracias",
    title: "Recibimos su solicitud",
    intro: "Nuestro equipo la revisará en oración y le enviaremos un correo cuando se tome una decisión.",
    body: "Le enviamos por correo un enlace privado a la página navideña de su familia. Cuando sea aprobado, usará esa página para hacer la lista de deseos de cada niño.",
    bookmark: "También puede guardarla ahora:",
    go: "Ir a la página de mi familia",
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
    waitlist: "Su solicitud está en nuestra lista de espera. Le avisaremos si se abre un lugar. Gracias por su paciencia.",
    denied: "Lo sentimos, este año no podemos patrocinar a su familia. Si tiene preguntas, escriba a",
    approved: "¡Buenas noticias: su familia fue aprobada!",
    approvedHow: (max) =>
      `Agregue hasta ${max} regalos a la lista de cada niño y luego presione “Enviar listas de deseos” al final de la página.`,
    listsDue: "Las listas se deben enviar a más tardar el",
    tip: (budget) =>
      `Consejo: un patrocinador normalmente gasta unos ${budget} por niño. Incluya cosas que necesitan (ropa, zapatos, abrigos) y cosas que desean, y algunos artículos de menor precio.`,
    submittedOn: (date) => `Sus listas de deseos se enviaron el ${date}. Sus niños ya están en nuestro Árbol de Ángeles.`,
    needChange: "¿Necesita cambiar algo? Escriba a",
    pastDeadline: "La fecha límite para las listas ya pasó. Comuníquese con nosotros si necesita ayuda.",
    emptyError: "Cada niño necesita al menos un regalo en su lista antes de enviar.",
    pickup: "Entrega de regalos",
    pickedUp: (date) => `Regalos recogidos el ${date}. ¡Feliz Navidad!`,
    ageLine: (gender, age) => `${gender}, ${age} años`,
    shirt: "Camisa",
    pants: "Pantalón",
    shoes: "Zapatos",
    interests: "Intereses",
    loves: "Le encanta",
    saveSizes: "Guardar tallas e intereses",
    wishList: "Lista de deseos",
    noItems: "Todavía no hay regalos.",
    about: (price) => `aprox. ${price}`,
    item: "Regalo",
    itemPh: "ej. Abrigo de invierno",
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
    decisionSubject: "Su solicitud de patrocinio navideño",
    waitlist: (first, extra, button) => `<p>Hola ${first}:</p>
<p>Gracias por su solicitud. Su familia está en nuestra lista de espera. Le avisaremos si se abre un lugar.</p>${extra}${button}`,
    statusButton: "Ver mi estado",
    denied: (first, extra) => `<p>Hola ${first}:</p>
<p>Gracias por su solicitud. Lo sentimos, pero este año no podemos patrocinar a su familia.</p>${extra}
<p>Estaremos orando por usted y su familia en esta Navidad.</p>`,
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
