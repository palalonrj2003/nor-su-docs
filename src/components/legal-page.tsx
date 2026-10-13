import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Brand } from './brand'
import { PRIVACY_NOTICE_VERSION } from '@/lib/application'

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return <div className="min-h-screen bg-background">
    <header className="border-b border-border bg-card"><div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5"><Link to="/"><Brand /></Link></div></header>
    <main className="mx-auto max-w-3xl px-6 py-10">
      <p className="mb-3 inline-flex rounded-full bg-warning-soft px-3 py-1 text-xs font-medium text-warning">Draft for review by NORSU's Data Protection Officer</p>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Version {PRIVACY_NOTICE_VERSION}</p>
      <div className="legal mt-8 space-y-6 text-sm leading-7">{children}</div>
      <p className="mt-10 text-sm"><Link to="/privacy" className="text-primary underline">Privacy Notice</Link> · <Link to="/terms" className="text-primary underline">Terms and Conditions</Link></p>
    </main>
  </div>
}

export function PrivacyContent() {
  return <>
    <section><h2 className="text-lg font-semibold">Who we are</h2><p>Balay NORSU is the online dormitory application system of the Negros Oriental State University, Bais City Campus (NORSU BSC) dormitory.</p></section>
    <section><h2 className="text-lg font-semibold">What we collect</h2><ul className="list-disc pl-5"><li>Your name, sex, birthdate, contact number and email.</li><li>Your home address and municipality.</li><li>Your student ID, college/program and year level.</li><li>Your parent or guardian's name, relationship, contact number and email.</li><li>An emergency contact's name, relationship and contact number.</li><li>Your preferred room or building (optional).</li><li>Uploaded documents: load slip, school ID (optional) and the notarized parental consent form.</li></ul></section>
    <section><h2 className="text-lg font-semibold">Why we collect it</h2><p>Only to process your dormitory application, verify your enrollment and parental consent, assign you a bed, and contact you or your guardian about your stay or in an emergency.</p></section>
    <section><h2 className="text-lg font-semibold">Who can see it</h2><p>Only the dorm supervisor can see your application details and documents. Dormitory staff can only see your name, room and bed if you become a resident. We do not sell or share your data with anyone else, unless required by law.</p></section>
    <section><h2 className="text-lg font-semibold">How long we keep it</h2><p>We keep your data while you apply and while you live in the dormitory. Documents of rejected or incomplete applications are deleted after a set period, to be decided with NORSU's Data Protection Officer.</p></section>
    <section><h2 className="text-lg font-semibold">How we protect it</h2><p>Your data is sent over secure connections, stored in access-controlled storage, and documents are never available through public links. Each account can only see its own application.</p></section>
    <section><h2 className="text-lg font-semibold">Your rights</h2><p>Under the Philippine Data Privacy Act of 2012 (Republic Act No. 10173), you have the right to be informed, to access your data, to correct it, to ask for its deletion, to object, and to file a complaint with the National Privacy Commission. To use these rights, contact the dorm supervisor or NORSU's Data Protection Officer.</p></section>
  </>
}

export function TermsContent() {
  return <>
    <section><h2 className="text-lg font-semibold">Using Balay NORSU</h2><p>Balay NORSU is for NORSU BSC students applying to the university dormitory. Keep your account details private; you are responsible for activity on your account.</p></section>
    <section><h2 className="text-lg font-semibold">Truthful information</h2><p>Everything you submit must be true and complete. False information or altered documents may lead to rejection of your application or removal from the dormitory.</p></section>
    <section><h2 className="text-lg font-semibold">Parental consent</h2><p>Your application can only be approved once your notarized parental consent form has been verified by the dorm supervisor.</p></section>
    <section><h2 className="text-lg font-semibold">No guarantee of a bed</h2><p>Submitting an application does not guarantee a bed. Applications may be approved, waitlisted or rejected depending on availability and requirements.</p></section>
    <section><h2 className="text-lg font-semibold">Privacy</h2><p>Your personal data is handled as described in the Privacy Notice.</p></section>
  </>
}
