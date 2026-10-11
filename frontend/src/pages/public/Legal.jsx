import { Link } from 'react-router'

const UPDATED = '11 October 2026'

/**
 * Terms of Service and Privacy Policy. The wording describes what EditFlow actually does
 * (inquiries, client portal, Drive links, manually recorded payments) — keep it in sync with the
 * product, and have it reviewed before relying on it legally.
 */
function LegalPage({ eyebrow, title, intro, sections }) {
  return (
    <main className="relative z-10 mx-auto max-w-3xl px-4 pb-24 pt-32 sm:px-6 lg:pt-40">
      <p className="eyebrow text-accent-400">{eyebrow}</p>
      <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.02] tracking-[-0.03em] text-white sm:text-5xl">{title}</h1>
      <p className="mt-4 text-sm text-zinc-500">Last updated {UPDATED}</p>
      <p className="mt-6 text-zinc-300">{intro}</p>

      <nav aria-label="On this page" className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <p className="eyebrow mb-3 text-zinc-500">On this page</p>
        <ol className="grid gap-1.5 text-sm sm:grid-cols-2">
          {sections.map((section, index) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="text-zinc-400 transition-colors hover:text-white">
                {index + 1}. {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-12 space-y-10">
        {sections.map((section, index) => (
          <section key={section.id} id={section.id} className="scroll-mt-28">
            <h2 className="font-display text-xl font-bold tracking-tight text-white">{index + 1}. {section.title}</h2>
            <div className="mt-3 space-y-3 leading-relaxed text-zinc-400 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-zinc-200 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
              {section.body}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}

const CONTACT = (
  <p>
    Questions? Reach out through the <Link to="/work-with-me" className="text-zinc-200 underline underline-offset-4 hover:text-white">Work With Me</Link> page
    or the WhatsApp or email contact you already use with your editor.
  </p>
)

const TERMS = [
  {
    id: 'services',
    title: 'The service',
    body: (
      <p>
        EditFlow is a video editing service for creators and brands — reels, YouTube Shorts, YouTube videos and podcasts —
        together with a private client portal where you can follow each video from raw footage to delivery. These terms apply
        when you use this website, submit an inquiry or use the client portal.
      </p>
    ),
  },
  {
    id: 'inquiries',
    title: 'Inquiries',
    body: (
      <p>
        Submitting the Work With Me form is a request, not a contract. Nothing is agreed until your editor accepts the inquiry and
        you both confirm the scope and the monthly fee. An inquiry may be declined.
      </p>
    ),
  },
  {
    id: 'projects',
    title: 'Projects, scope and deadlines',
    body: (
      <>
        <p>
          Work is organised as monthly projects. Each project has an agreed fee and a set of planned videos with their deadlines,
          all visible in your portal.
        </p>
        <p>
          Deadlines depend on receiving your raw footage on time. If footage arrives late or the brief changes, deadlines may move
          accordingly.
        </p>
      </>
    ),
  },
  {
    id: 'your-content',
    title: 'Your footage and content',
    body: (
      <>
        <p>
          You share footage through Google Drive links; EditFlow stores the links, not the files. You confirm that you own or have
          permission to use everything you provide — footage, music, logos, likenesses and other material — and that the content
          doesn&apos;t break any law or anyone else&apos;s rights.
        </p>
        <p>You keep ownership of your original material.</p>
      </>
    ),
  },
  {
    id: 'review',
    title: 'Review, revisions and approval',
    body: (
      <>
        <p>
          When a video is ready, it appears in your portal for review. You can <strong>approve</strong> it or <strong>request a
          revision</strong> with the timecode of what to change. Reasonable revisions within the agreed brief are part of the service;
          new ideas outside the brief may be treated as new work.
        </p>
        <p>Approving a video confirms the final cut is accepted and ready for delivery.</p>
      </>
    ),
  },
  {
    id: 'payments',
    title: 'Fees and payments',
    body: (
      <>
        <p>
          Fees are agreed per monthly project in Indian Rupees (₹). Payments are made directly to your editor (for example by UPI or
          bank transfer) and recorded in the portal, where you can see what you&apos;ve paid and any balance. EditFlow does not process
          card or bank payments and never asks for your card or bank details.
        </p>
        <p>Approval and delivery don&apos;t replace payment: the agreed fee remains due as arranged.</p>
      </>
    ),
  },
  {
    id: 'delivery',
    title: 'Delivery and use of final videos',
    body: (
      <p>
        Final videos are delivered through Google Drive. Once the project fee is paid in full, you may use the delivered videos for
        your own channels and business. Your work is only shown in a portfolio with your permission.
      </p>
    ),
  },
  {
    id: 'account',
    title: 'Your portal account',
    body: (
      <p>
        Portal access is personal to you. Change the temporary password you receive at first sign-in, keep your password private,
        and let your editor know if you think someone else has accessed your account. Access may be suspended if the account is
        misused.
      </p>
    ),
  },
  {
    id: 'liability',
    title: 'Liability',
    body: (
      <p>
        The service is provided with reasonable care and skill. To the extent the law allows, liability for any claim related to a
        project is limited to the fees paid for that project, and there is no liability for indirect losses such as lost profits or
        lost reach. Nothing here limits rights you have under applicable consumer law.
      </p>
    ),
  },
  {
    id: 'ending',
    title: 'Ending the arrangement',
    body: (
      <p>
        Either side may stop future monthly projects with reasonable notice. Fees for work already completed remain payable.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes and governing law',
    body: (
      <p>
        These terms may be updated; the date above shows the latest version. They are governed by the laws of India.
      </p>
    ),
  },
  { id: 'contact', title: 'Contact', body: CONTACT },
]

const PRIVACY = [
  {
    id: 'collect',
    title: 'What we collect',
    body: (
      <ul>
        <li><strong>Inquiries:</strong> your name, email, phone number or Instagram handle, content type, videos per month, budget, preferred start date and any notes you add.</li>
        <li><strong>Clients:</strong> your name, email, phone, Instagram and company name, and your portal login (your password is stored only as a one-way hash).</li>
        <li><strong>Project records:</strong> projects, video titles, deadlines, statuses, Google Drive links, revision requests and approval dates.</li>
        <li><strong>Payment records:</strong> amounts, dates and notes of payments you make. No card, UPI PIN or bank account details are collected.</li>
      </ul>
    ),
  },
  {
    id: 'use',
    title: 'How it is used',
    body: (
      <p>
        Only to respond to your inquiry, run your projects, show you their progress and payments in the portal, and keep the
        records needed for the work. Your data is not sold, rented or used for advertising.
      </p>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and tracking',
    body: (
      <p>
        There are no analytics, advertising or tracking cookies. When you sign in, a session token is kept in your browser&apos;s
        session storage for that tab only; it is removed when you sign out or close the tab.
      </p>
    ),
  },
  {
    id: 'sharing',
    title: 'Services involved',
    body: (
      <>
        <p>
          The site and its database run on hosting providers that process data on our behalf. Videos and footage stay in Google
          Drive under Google&apos;s own privacy policy. Fonts are loaded from Fontshare.
        </p>
        <p>Information is otherwise only disclosed if the law requires it.</p>
      </>
    ),
  },
  {
    id: 'security',
    title: 'Security',
    body: (
      <p>
        Passwords are hashed, connections use HTTPS in production, and each client can only see their own projects, videos and
        payments. No system is perfectly secure, but access is kept to what the work requires.
      </p>
    ),
  },
  {
    id: 'retention',
    title: 'How long it is kept',
    body: (
      <p>
        Inquiry and project information is kept while we work together and afterwards for as long as needed for records and
        legal obligations. Declined inquiries can be deleted on request.
      </p>
    ),
  },
  {
    id: 'rights',
    title: 'Your choices',
    body: (
      <p>
        You can ask to see, correct or delete your information, or to close your portal account. Some records, such as payment
        history, may need to be kept for legal or accounting reasons.
      </p>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    body: <p>The service is meant for adults and businesses. Please don&apos;t submit an inquiry if you are under 18.</p>,
  },
  {
    id: 'updates',
    title: 'Changes to this policy',
    body: <p>This policy may be updated; the date above shows the latest version.</p>,
  },
  { id: 'contact', title: 'Contact', body: CONTACT },
]

export function Terms() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      intro="The basics of working together: how inquiries, projects, reviews, payments and delivery work."
      sections={TERMS}
    />
  )
}

export function Privacy() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="What information EditFlow collects, why, and the choices you have. Short version: only what the work needs, never sold, no tracking."
      sections={PRIVACY}
    />
  )
}
