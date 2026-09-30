/**
 * Who the wizard is talking to: the testator, or the lawyer drafting for one.
 *
 * Everybody but a verified lawyer writes their own Will, so the forms say
 * "my executors" and "your photograph". A lawyer draws a Will for a client:
 * the executors are not theirs, the photograph is not of them, and a box
 * reading "I am of sound mind" would have them attest to the wrong person's
 * capacity. The wizard used to say all of that to both.
 *
 * Two columns of one shape, so a line added for one reader cannot be forgotten
 * for the other — the compiler refuses a column with a key missing. Step and
 * section headings are in `./steps`, which owns them; this is the wording
 * inside the forms.
 *
 * Presentation only. Whether an account drafts for a client is the server's
 * answer (`may_name_another_testator`); this words it.
 */
export type WillVoice = {
  photograph: {
    /** Under the frame, before one is chosen and after. */
    note: string;
    alt: string;
  };
  declaration: {
    /** Up to the emphasised "Last Will and Testament", which the form renders. */
    lastWillLead: string;
    revokes: string;
    soundMind: string;
  };
  trustees: {
    executorsAct: string;
    trustAccount: string;
  };
  assets: {
    empty: string;
    none: string;
  };
  gifts: {
    empty: string;
    estateInTrust: string;
  };
  residue: {
    directionsLabel: string;
    directionsHint: string;
  };
  funeral: {
    otherWishesLabel: string;
    otherWishesPlaceholder: string;
  };
  review: {
    confirmAccurate: string;
    /** Refusing to take a lodging payment before the confirmation is ticked. */
    confirmBeforePaying: string;
    subscriptionNeeded: string;
    lodgeUpdated: string;
    lodgeNote: string;
    afterPayment: string;
  };
};

const OWN: WillVoice = {
  photograph: {
    note: "Printed on the face of your Will. Use a recent photograph against a plain background — it saves as soon as you choose it.",
    alt: "Your passport photograph",
  },
  declaration: {
    lastWillLead: "I declare this document to be my",
    revokes:
      "I revoke all Wills, codicils and testamentary dispositions previously made by me.",
    soundMind:
      "I am of sound mind, memory and understanding, and of full legal age.",
  },
  trustees: {
    executorsAct: "My executors should also act as my trustees.",
    trustAccount:
      "Direct my executors to open a trust bank account, from which any guardian is provided with what my children need.",
  },
  assets: {
    empty:
      "Nothing listed yet. Add what you own — land, buildings, vehicles, accounts, jewellery, personal effects.",
    none: "I have nothing to list separately.",
  },
  gifts: {
    empty:
      "No specific gifts listed yet. Add one, or choose below to leave everything to your trustees.",
    estateInTrust:
      "I would rather not name gifts individually — leave my whole estate, including everything listed as an asset, to my trustees to hold and manage for my beneficiaries on the shares I set below.",
  },
  residue: {
    directionsLabel: "Directions to your executors about the residue",
    directionsHint: "In your own words",
  },
  funeral: {
    otherWishesLabel: "Any other wishes for your executors",
    otherWishesPlaceholder: "Anything else your executors should know.",
  },
  review: {
    confirmAccurate:
      "I confirm that the information recorded in this Will is accurate and reflects my wishes.",
    confirmBeforePaying:
      "Confirm that the information in your Will is accurate first, so it can be submitted as soon as your payment clears.",
    subscriptionNeeded:
      "Writing your Will was a one-off purchase. Keeping it current as your life changes is what the subscription covers.",
    lodgeUpdated: "Lodge my updated Will with the Probate Registry",
    lodgeNote:
      "Optional — you can lodge it yourself. A Will that has been reviewed should always be lodged, so the registry holds the version that counts.",
    afterPayment:
      "After payment you confirm it is you, and your updated Will is submitted.",
  },
};

const FOR_CLIENT: WillVoice = {
  photograph: {
    note: "Printed on the face of your client's Will. Use a recent passport photograph of your client against a plain background — it saves as soon as you choose it.",
    alt: "Your client's passport photograph",
  },
  declaration: {
    lastWillLead: "My client declares this document to be their",
    revokes:
      "My client revokes all Wills, codicils and testamentary dispositions previously made by them.",
    soundMind:
      "My client is of sound mind, memory and understanding, and of full legal age.",
  },
  trustees: {
    executorsAct: "The executors should also act as the trustees.",
    trustAccount:
      "Direct the executors to open a trust bank account, from which any guardian is provided with what my client's children need.",
  },
  assets: {
    empty:
      "Nothing listed yet. Add what your client owns — land, buildings, vehicles, accounts, jewellery, personal effects.",
    none: "My client has nothing to list separately.",
  },
  gifts: {
    empty:
      "No specific gifts listed yet. Add one, or choose below to leave everything to the trustees.",
    estateInTrust:
      "My client would rather not name gifts individually — leave the whole estate, including everything listed as an asset, to the trustees to hold and manage for the beneficiaries on the shares set below.",
  },
  residue: {
    directionsLabel: "Your client's directions to the executors about the residue",
    directionsHint: "In your client's own words",
  },
  funeral: {
    otherWishesLabel: "Any other wishes for the executors",
    otherWishesPlaceholder: "Anything else the executors should know.",
  },
  review: {
    confirmAccurate:
      "I confirm that the information recorded in this Will is accurate and reflects my client's instructions.",
    confirmBeforePaying:
      "Confirm that the information in this Will is accurate first, so it can be submitted as soon as your payment clears.",
    subscriptionNeeded:
      "Drafting this Will was a one-off purchase. Keeping it current as your client's life changes is what its subscription covers.",
    lodgeUpdated: "Lodge this updated Will with the Probate Registry",
    lodgeNote:
      "Optional — it can be lodged without us. Lodging the update means the registry holds the version that counts.",
    afterPayment:
      "After payment you confirm it is you, and the updated Will is submitted.",
  },
};

export function willVoice(forClient = false): WillVoice {
  return forClient ? FOR_CLIENT : OWN;
}
