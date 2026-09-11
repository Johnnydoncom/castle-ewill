"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function PrivacyAccordion({ companyEmail }: { companyEmail: string }) {
  return (
    <Accordion type="multiple" className="mt-8">
      {/* ── Article 1 ────────────────────────────────────── */}
      <AccordionItem value="article-1">
        <AccordionTrigger className="font-serif text-base text-navy sm:text-lg">
          Article 1: Our Guiding Principles on Data Processing
        </AccordionTrigger>
        <AccordionContent className="prose prose-sm max-w-none text-foreground/85">
          <p>
            In processing your personal data, we adhere to the principles of
            data processing. Our obligation in terms of the principle is to
            ensure that personal data is:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Processed in a fair, lawful and transparent manner;</li>
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
          <p className="mt-3">
            Furthermore, we are committed to ensuring accountability,
            demonstrating duty of care to you and also upholding data
            Confidentiality, Integrity and Availability.
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* ── Article 2 ────────────────────────────────────── */}
      <AccordionItem value="article-2">
        <AccordionTrigger className="font-serif text-base text-navy sm:text-lg">
          Article 2: Consent of Data Subject
        </AccordionTrigger>
        <AccordionContent className="prose prose-sm max-w-none text-foreground/85">
          <p>
            Except as otherwise required by operation of law or principles of
            law, your consent as the data subject is paramount in our
            considerations. You have the right to give, withhold or otherwise
            withdraw your consent to data processing.
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* ── Article 3 ────────────────────────────────────── */}
      <AccordionItem value="article-3">
        <AccordionTrigger className="font-serif text-base text-navy sm:text-lg">
          Article 3: Our Scope of Data Processing
        </AccordionTrigger>
        <AccordionContent className="prose prose-sm max-w-none text-foreground/85">
          <p>
            In varying degrees, vis-à-vis the services we provide for you or
            your level of engagement with us, we do process your personal data.
            Below is a table containing the major types of personal data, the
            purpose and the lawful bases for processing them:
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2 text-left font-semibold">S/N</th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Purpose of Collection
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Type of Data
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Lawful Basis
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-3 py-2">1</td>
                  <td className="px-3 py-2">Will &amp; Trust Creation</td>
                  <td className="px-3 py-2">
                    Name, Phone Number, Email Address, Contact Address, Sex,
                    Date of Birth, Photograph, Family &amp; Beneficiary Details,
                    Asset Information.
                  </td>
                  <td className="px-3 py-2">
                    Contract &amp; Legal Obligation.
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="px-3 py-2">2</td>
                  <td className="px-3 py-2">Notifications</td>
                  <td className="px-3 py-2">
                    Name, Phone Number, Email Address, Contact Address, Sex and
                    Date of Birth.
                  </td>
                  <td className="px-3 py-2">
                    Legal Obligation. Some may require consent as prescribed by
                    the NDP Act.
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="px-3 py-2">3</td>
                  <td className="px-3 py-2">Data Analytics</td>
                  <td className="px-3 py-2">
                    Name, Phone Number, Email Address, Contact Address, Sex and
                    Date of Birth.
                  </td>
                  <td className="px-3 py-2">
                    Consent (to ensure that our services suit the purpose of
                    data subjects and to measure our performance). Some may
                    involve legitimate interest or legal obligation.
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="px-3 py-2">4</td>
                  <td className="px-3 py-2">Security</td>
                  <td className="px-3 py-2">
                    Name, Phone Number, Email Address, Contact Address, Sex,
                    Date of Birth and Photograph.
                  </td>
                  <td className="px-3 py-2">
                    Legal Obligation. For safety and security of lives and
                    property.
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2">5</td>
                  <td className="px-3 py-2">
                    Legal Review &amp; Consultation
                  </td>
                  <td className="px-3 py-2">
                    Name, Phone Number, Email Address, Contact Address, Sex,
                    Date of Birth, Photograph, Will Documents.
                  </td>
                  <td className="px-3 py-2">
                    Contract. Some instances may involve other lawful bases such
                    as consent or legal obligation.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── Article 4 ────────────────────────────────────── */}
      <AccordionItem value="article-4">
        <AccordionTrigger className="font-serif text-base text-navy sm:text-lg">
          Article 4: Rights of Data Subjects
        </AccordionTrigger>
        <AccordionContent className="prose prose-sm max-w-none text-foreground/85">
          <p>
            We hold your privacy rights very dear to our operations. Apart from
            the right to give, withhold or withdraw consent, you have rights to
            all relevant information that may guide you in making informed
            decisions about your personal data. For example, you have the right
            to be notified of anyone or any place to which we may transfer your
            personal data.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
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
        </AccordionContent>
      </AccordionItem>

      {/* ── Article 5 ────────────────────────────────────── */}
      <AccordionItem value="article-5">
        <AccordionTrigger className="font-serif text-base text-navy sm:text-lg">
          Article 5: Withholding Relevant Data
        </AccordionTrigger>
        <AccordionContent className="prose prose-sm max-w-none text-foreground/85">
          <p>
            There are types of personal data that are mandatory for us to
            process in order to carry out your instructions or perform our
            services for your benefit. If you withhold such information, it may
            be impracticable to carry out our services in relation to you. If
            you seek more clarification on our data processing, please contact
            our designated Data Protection Officer as provided under Article 12
            below.
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* ── Article 6 ────────────────────────────────────── */}
      <AccordionItem value="article-6">
        <AccordionTrigger className="font-serif text-base text-navy sm:text-lg">
          Article 6: Transfer of Data to a Third Party
        </AccordionTrigger>
        <AccordionContent className="prose prose-sm max-w-none text-foreground/85">
          <p>
            Third parties may wish to provide essential services to you (through
            our platforms) while relying on the relevant lawful bases for
            processing your personal data in this regard. The type of data
            usually processed for this may be your contact details. Where such
            services depend on consent, you have the right to decline and
            further restrict the processing of your personal data.
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* ── Article 7 ────────────────────────────────────── */}
      <AccordionItem value="article-7">
        <AccordionTrigger className="font-serif text-base text-navy sm:text-lg">
          Article 7: Technical Information and Cookies
        </AccordionTrigger>
        <AccordionContent className="prose prose-sm max-w-none text-foreground/85">
          <p>
            This website is designed to collect your IP address and other
            information that your web browser typically shares with the websites
            that you visit. The purpose of this is to know you better and to
            automatically and dynamically engage with you through your actions
            on our website.
          </p>
          <p className="mt-3">
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
        </AccordionContent>
      </AccordionItem>

      {/* ── Article 8 ────────────────────────────────────── */}
      <AccordionItem value="article-8">
        <AccordionTrigger className="font-serif text-base text-navy sm:text-lg">
          Article 8: Personal Data Security and Integrity
        </AccordionTrigger>
        <AccordionContent className="prose prose-sm max-w-none text-foreground/85">
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
        </AccordionContent>
      </AccordionItem>

      {/* ── Article 9 ────────────────────────────────────── */}
      <AccordionItem value="article-9">
        <AccordionTrigger className="font-serif text-base text-navy sm:text-lg">
          Article 9: Purpose and Storage Limitation
        </AccordionTrigger>
        <AccordionContent className="prose prose-sm max-w-none text-foreground/85">
          <p>
            The purpose of data processing usually determines the length of
            time within which your personal data is stored with us and the
            residue of data actually stored for this purpose. We collect and
            store personal data that is reasonably required by law or best
            practice to serve you or respond to legitimate enquiry about our
            transaction with you.
          </p>
          <p className="mt-3">
            Except as may be necessary for archiving purposes in the public
            interest, scientific, historical research purposes, or statistical
            purposes, we may store your personal data for no longer than is
            necessary to fulfil the purposes for which it was collected. We take
            this responsibility very seriously in view of the need for you to
            enjoy your privacy as guaranteed under the 1999 Constitution of the
            Federal Republic of Nigeria and international human rights law.
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* ── Article 10 ───────────────────────────────────── */}
      <AccordionItem value="article-10">
        <AccordionTrigger className="font-serif text-base text-navy sm:text-lg">
          Article 10: Caveat on Website Links
        </AccordionTrigger>
        <AccordionContent className="prose prose-sm max-w-none text-foreground/85">
          <p>
            This website may contain links to other websites. Save and except as
            otherwise expressly stated by us, any link to another website is not
            covered by our privacy policy. We strongly advise that you should
            satisfy yourself with the details of any privacy policy provided on
            other websites or links.
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* ── Article 11 ───────────────────────────────────── */}
      <AccordionItem value="article-11">
        <AccordionTrigger className="font-serif text-base text-navy sm:text-lg">
          Article 11: Transfer to Third Parties and Countries
        </AccordionTrigger>
        <AccordionContent className="prose prose-sm max-w-none text-foreground/85">
          <p>
            In carrying out our services effectively, we may require the
            services of third parties who may be within or outside the NDP Act
            jurisdiction (Nigeria). Examples of such services include but are
            not limited to the following:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Internet connectivity</li>
            <li>Cloud storage</li>
            <li>Data analytics</li>
            <li>Data security</li>
            <li>Software development</li>
            <li>Legal review and consultation</li>
          </ul>
          <p className="mt-3">
            In transferring your data to third parties, we shall be guided by
            the NDP Act. See Part VIII of the NDP Act. Categories of third
            parties we may share your data with are those that offer the
            above-mentioned services.
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* ── Article 12 ───────────────────────────────────── */}
      <AccordionItem value="article-12">
        <AccordionTrigger className="font-serif text-base text-navy sm:text-lg">
          Article 12: Data Protection Officer
        </AccordionTrigger>
        <AccordionContent className="prose prose-sm max-w-none text-foreground/85">
          <p>
            We have provided a platform to respond promptly and satisfactorily
            to all your requests, suggestions and complaints. We have a Data
            Protection Officer who is responsible for prompt action on your data
            privacy. Contact our Data Protection Officer via email at{" "}
            <a href={`mailto:${companyEmail}`} className="underline">
              {companyEmail}
            </a>
            .
          </p>
          <p className="mt-3">
            Our Data Protection Officer provides the following services:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
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
        </AccordionContent>
      </AccordionItem>

      {/* ── Article 13 ───────────────────────────────────── */}
      <AccordionItem value="article-13">
        <AccordionTrigger className="font-serif text-base text-navy sm:text-lg">
          Article 13: Remediation
        </AccordionTrigger>
        <AccordionContent className="prose prose-sm max-w-none text-foreground/85">
          <p>
            Data subjects are encouraged to report any complaint or concern
            about their data privacy through our Data Protection Officer. Our
            team shall take action to redress any grievance within 7 (seven)
            working days. If this extends for any reason, the data subject will
            be duly notified and appropriate measures will be taken to ensure
            that the rights and interests of the data subject are protected.
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* ── Article 14 ───────────────────────────────────── */}
      <AccordionItem value="article-14">
        <AccordionTrigger className="font-serif text-base text-navy sm:text-lg">
          Article 14: Alteration of Privacy Policy
        </AccordionTrigger>
        <AccordionContent className="prose prose-sm max-w-none text-foreground/85">
          <p>
            Castle eWill &amp; Trust reserves the right to alter the foregoing
            policy for the purposes of advancing data privacy rights, public
            interest or complying with lawful directives of the Federal
            Government &mdash; in line with the safeguards under the NDP Act and
            the 1999 Constitution of the Federal Republic of Nigeria.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
