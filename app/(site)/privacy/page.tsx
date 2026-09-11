import { COMPANY } from "@/lib/company";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" },
  title: "Privacy Policy",
  description:
    "How Castle eWill & Trust collects, uses and safeguards your personal information under the Nigeria Data Protection Act.",
};

export default function PrivacyPage() {
  return (
    <>
      <section className="bg-hero-gradient">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-24">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
            Legal
          </p>
          <h1 className="font-serif text-5xl text-navy sm:text-6xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Last updated: 11 September 2026
          </p>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-base prose-headings:mb-2 max-w-none text-foreground/85">
          {/* ── Preamble ─────────────────────────────────────── */}
          <h2 className="font-serif text-navy">Preamble</h2>
          <p>
            This Privacy Policy regulates how Castle eWill &amp; Trust
            (&ldquo;Castle&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;) will
            process the personal information of our data subjects such as:
            users, beneficiaries, executors, programme participants and visitors
            to this website.
          </p>
          <p>
            In line with the provisions of the Nigeria Data Protection Act (NDP
            Act), 2023, and other applicable data privacy laws and regulations,
            Castle eWill &amp; Trust maintains the privacy principles which
            govern how we collect, use, record, organise, structure, store,
            adapt or alter, retrieve, consult, disclose, disseminate, align,
            combine, restrict, erase or destroy and generally manage your
            personal data.
          </p>

          {/* ── Article 1 ────────────────────────────────────── */}
          <h2 className="font-serif text-navy">
            Article 1: Our Guiding Principles on Data Processing
          </h2>
          <p>
            In processing your personal data, we adhere to the principles of
            data processing. Our obligation in terms of the principle is to
            ensure that personal data is:
          </p>
          <ul>
            <li>
              Processed in a fair, lawful and transparent manner;
            </li>
            <li>
              Collected for specified, explicit, and legitimate purposes, and
              not to be further processed in a way incompatible with these
              purposes;
            </li>
            <li>
              Adequate, relevant, and limited to the minimum necessary for the
              purposes for which the personal data was collected or further
              processed;
            </li>
            <li>
              Retained for not longer than is necessary to achieve the lawful
              bases for which the personal data was collected or further
              processed;
            </li>
            <li>
              Accurate, complete, not misleading, and, where necessary, kept up
              to date having regard to the purposes for which the personal data
              is collected or is further processed; and
            </li>
            <li>
              Processed in a manner that ensures appropriate security of
              personal data, including protection against unauthorised or
              unlawful processing, access, loss, destruction, damage, or any
              form of data breach.
            </li>
          </ul>
          <p>
            Furthermore, we are committed to ensuring accountability,
            demonstrating duty of care to you and also upholding data
            Confidentiality, Integrity and Availability.
          </p>

          {/* ── Article 2 ────────────────────────────────────── */}
          <h2 className="font-serif text-navy">
            Article 2: Consent of Data Subject
          </h2>
          <p>
            Except as otherwise required by operation of law or principles of
            law, your consent as the data subject is paramount in our
            considerations. You have the right to give, withhold or otherwise
            withdraw your consent to data processing.
          </p>

          {/* ── Article 3 ────────────────────────────────────── */}
          <h2 className="font-serif text-navy">
            Article 3: Our Scope of Data Processing
          </h2>
          <p>
            In varying degrees, vis-à-vis the services we provide for you or
            your level of engagement with us, we do process your personal data.
            Below is a table containing the major types of personal data, the
            purpose and the lawful bases for processing them:
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left font-semibold">S/N</th>
                  <th className="text-left font-semibold">Purpose of Collection</th>
                  <th className="text-left font-semibold">Type of Data</th>
                  <th className="text-left font-semibold">Lawful Basis</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>Will &amp; Trust Creation</td>
                  <td>
                    Name, Phone Number, Email Address, Contact Address, Sex,
                    Date of Birth, Photograph, Family &amp; Beneficiary Details,
                    Asset Information.
                  </td>
                  <td>Contract &amp; Legal Obligation.</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>Notifications</td>
                  <td>
                    Name, Phone Number, Email Address, Contact Address, Sex and
                    Date of Birth.
                  </td>
                  <td>
                    Legal Obligation. Some may require consent as prescribed by
                    the NDP Act.
                  </td>
                </tr>
                <tr>
                  <td>3</td>
                  <td>Data Analytics</td>
                  <td>
                    Name, Phone Number, Email Address, Contact Address, Sex and
                    Date of Birth.
                  </td>
                  <td>
                    Consent (to ensure that our services suit the purpose of
                    data subjects and to measure our performance). Some may
                    involve legitimate interest or legal obligation.
                  </td>
                </tr>
                <tr>
                  <td>4</td>
                  <td>Security</td>
                  <td>
                    Name, Phone Number, Email Address, Contact Address, Sex,
                    Date of Birth and Photograph.
                  </td>
                  <td>
                    Legal Obligation. For safety and security of lives and
                    property.
                  </td>
                </tr>
                <tr>
                  <td>5</td>
                  <td>Legal Review &amp; Consultation</td>
                  <td>
                    Name, Phone Number, Email Address, Contact Address, Sex,
                    Date of Birth, Photograph, Will Documents.
                  </td>
                  <td>
                    Contract. Some instances may involve other lawful bases such
                    as consent or legal obligation.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── Article 4 ────────────────────────────────────── */}
          <h2 className="font-serif text-navy">
            Article 4: Rights of Data Subjects
          </h2>
          <p>
            We hold your privacy rights very dear to our operations. Apart from
            the right to give, withhold or withdraw consent, you have rights to
            all relevant information that may guide you in making informed
            decisions about your personal data. For example, you have the right
            to be notified of anyone or any place to which we may transfer your
            personal data.
          </p>
          <ul>
            <li>Right to be Informed</li>
            <li>Right of Access</li>
            <li>Right to Rectification</li>
            <li>Right to Object to Processing</li>
            <li>Right to Data Portability</li>
            <li>Right to be Forgotten</li>
            <li>
              Right in Relation to Automated Decision Making (which essentially
              entitles you to human intervention)
            </li>
            <li>
              Right to lodge a complaint with the Nigeria Data Protection
              Commission (NDPC)
            </li>
          </ul>

          {/* ── Article 5 ────────────────────────────────────── */}
          <h2 className="font-serif text-navy">
            Article 5: Withholding Relevant Data
          </h2>
          <p>
            There are types of personal data that are mandatory for us to
            process in order to carry out your instructions or perform our
            services for your benefit. If you withhold such information, it may
            be impracticable to carry out our services in relation to you. If
            you seek more clarification on our data processing, please contact
            our designated Data Protection Officer as provided under Article 12
            below.
          </p>

          {/* ── Article 6 ────────────────────────────────────── */}
          <h2 className="font-serif text-navy">
            Article 6: Transfer of Data to a Third Party
          </h2>
          <p>
            Third parties may wish to provide essential services to you (through
            our platforms) while relying on the relevant lawful bases for
            processing your personal data in this regard. The type of data
            usually processed for this may be your contact details. Where such
            services depend on consent, you have the right to decline and
            further restrict the processing of your personal data.
          </p>

          {/* ── Article 7 ────────────────────────────────────── */}
          <h2 className="font-serif text-navy">
            Article 7: Technical Information and Cookies
          </h2>
          <p>
            This website is designed to collect your IP address and other
            information that your web browser typically shares with the websites
            that you visit. The purpose of this is to know you better and to
            automatically and dynamically engage with you through your actions
            on our website.
          </p>
          <p>
            &ldquo;Cookies&rdquo; are text files that are downloaded to your
            browsing devices such as phones or computers when you browse pages
            of websites. They contain small amounts of data and their essential
            function is to intelligently memorise your preferences and therefore
            present them to you as choices when you are browsing. We have taken
            measures to ensure that all methods adopted by us to engage
            automatically with you do not violate your privacy rights under the
            NDP Act. In the case of cookies, we ensure that they have security
            protocols and are not vulnerable to abuses by anyone.
          </p>

          {/* ── Article 8 ────────────────────────────────────── */}
          <h2 className="font-serif text-navy">
            Article 8: Personal Data Security and Integrity
          </h2>
          <p>
            We use cutting-edge technologies and robust protocols to provide you
            with comprehensive layers of security in the area of personal data.
            All data is encrypted at rest and in transit using AES-256. We are
            constantly vigilant in preventing cyber-attacks, fraudulent
            intrusion, unauthorised access, loss or corruption of personal data.
            We are equally cognizant of the obligations imposed on us by law in
            terms of data protection. Accordingly, we conduct reviews of process
            and privacy impact assessment, carry out trainings and obtain strict
            warranties where applicable.
          </p>

          {/* ── Article 9 ────────────────────────────────────── */}
          <h2 className="font-serif text-navy">
            Article 9: Purpose and Storage Limitation
          </h2>
          <p>
            The purpose of data processing usually determines the length of
            time within which your personal data is stored with us and the
            residue of data actually stored for this purpose. We collect and
            store personal data that is reasonably required by law or best
            practice to serve you or respond to legitimate enquiry about our
            transaction with you.
          </p>
          <p>
            Except as may be necessary for archiving purposes in the public
            interest, scientific, historical research purposes, or statistical
            purposes, we may store your personal data for no longer than is
            necessary to fulfil the purposes for which it was collected. We take
            this responsibility very seriously in view of the need for you to
            enjoy your privacy as guaranteed under the 1999 Constitution of the
            Federal Republic of Nigeria and international human rights law.
          </p>

          {/* ── Article 10 ───────────────────────────────────── */}
          <h2 className="font-serif text-navy">
            Article 10: Caveat on Website Links
          </h2>
          <p>
            This website may contain links to other websites. Save and except as
            otherwise expressly stated by us, any link to another website is not
            covered by our privacy policy. We strongly advise that you should
            satisfy yourself with the details of any privacy policy provided on
            other websites or links.
          </p>

          {/* ── Article 11 ───────────────────────────────────── */}
          <h2 className="font-serif text-navy">
            Article 11: Transfer to Third Parties and Countries
          </h2>
          <p>
            In carrying out our services effectively, we may require the
            services of third parties who may be within or outside the NDP Act
            jurisdiction (Nigeria). Examples of such services include but are
            not limited to the following:
          </p>
          <ul>
            <li>Internet connectivity</li>
            <li>Cloud storage</li>
            <li>Data analytics</li>
            <li>Data security</li>
            <li>Software development</li>
            <li>Legal review and consultation</li>
          </ul>
          <p>
            In transferring your data to third parties, we shall be guided by
            the NDP Act. See Part VIII of the NDP Act. Categories of third
            parties we may share your data with are those that offer the
            above-mentioned services.
          </p>

          {/* ── Article 12 ───────────────────────────────────── */}
          <h2 className="font-serif text-navy">
            Article 12: Data Protection Officer
          </h2>
          <p>
            We have provided a platform to respond promptly and satisfactorily
            to all your requests, suggestions and complaints. We have a Data
            Protection Officer who is responsible for prompt action on your data
            privacy. Contact our Data Protection Officer via email at{" "}
            <a
              href={`mailto:${COMPANY.email}`}
              className="underline"
            >
              {COMPANY.email}
            </a>
            .
          </p>
          <p>Our Data Protection Officer provides the following services:</p>
          <ul>
            <li>
              Data protection regulations compliance and breach services
            </li>
            <li>Data protection and privacy advisory services</li>
            <li>Data protection capacity building</li>
            <li>
              Data protection and privacy breach remediation planning and
              support services
            </li>
            <li>Information privacy audit</li>
            <li>Data privacy breach impact assessment</li>
            <li>
              Data Protection and Privacy Due Diligence Investigation
            </li>
          </ul>

          {/* ── Article 13 ───────────────────────────────────── */}
          <h2 className="font-serif text-navy">Article 13: Remediation</h2>
          <p>
            Data subjects are encouraged to report any complaint or concern
            about their data privacy through our Data Protection Officer. Our
            team shall take action to redress any grievance within 7 (seven)
            working days. If this extends for any reason, the data subject will
            be duly notified and appropriate measures will be taken to ensure
            that the rights and interests of the data subject are protected.
          </p>

          {/* ── Article 14 ───────────────────────────────────── */}
          <h2 className="font-serif text-navy">
            Article 14: Alteration of Privacy Policy
          </h2>
          <p>
            Castle eWill &amp; Trust reserves the right to alter the foregoing
            policy for the purposes of advancing data privacy rights, public
            interest or complying with lawful directives of the Federal
            Government &mdash; in line with the safeguards under the NDP Act and
            the 1999 Constitution of the Federal Republic of Nigeria.
          </p>

          {/* ── Attribution ──────────────────────────────────── */}
          <hr className="my-8" />
          <p className="text-xs text-muted-foreground">
            This privacy policy is modelled on the{" "}
            <a
              href="https://ndpc.gov.ng/our-data-privacy-policy/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Nigeria Data Protection Commission (NDPC) Data Privacy Policy
            </a>{" "}
            and adapted for Castle eWill &amp; Trust in compliance with the
            Nigeria Data Protection Act, 2023.
          </p>
        </div>
      </article>
    </>
  );
}
