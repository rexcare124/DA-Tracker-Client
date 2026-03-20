type DisciplinaryMatrixRow = {
  tactic: string
  legitimateTechnique: string
  retaliatoryTechnique: string
}

const disciplinaryMatrixRows: DisciplinaryMatrixRow[] = [
  {
    tactic: 'Performance Management',
    legitimateTechnique:
      'Progressive discipline and coaching plans with clear metrics and documented opportunities to improve.',
    retaliatoryTechnique:
      'Predetermined failure plans that set unrealistic milestones to manufacture a paper trail for termination.',
  },
  {
    tactic: 'Investigations',
    legitimateTechnique:
      'Neutral fact-finding using established complaint channels, due process, and evidence standards.',
    retaliatoryTechnique:
      'Retaliatory inquiries targeting minor or fabricated infractions to intimidate and discredit reporters.',
  },
  {
    tactic: 'Resource Allocation',
    legitimateTechnique:
      'Budget-driven duty changes tied to mission priorities and transparent operational needs.',
    retaliatoryTechnique:
      'Constructive demotion by stripping meaningful duties and assigning low-value or humiliating tasks.',
  },
  {
    tactic: 'Workforce Assignment',
    legitimateTechnique:
      'Reassignment or scheduling adjustments applied consistently for documented coverage needs.',
    retaliatoryTechnique:
      'Isolation transfers and schedule manipulation designed to create personal and professional hardship.',
  },
  {
    tactic: 'Fitness and Capability Reviews',
    legitimateTechnique:
      'Fitness-for-duty evaluations used only when objective safety or performance indicators are present.',
    retaliatoryTechnique:
      "Weaponized medical reviews that question stability or credibility after protected disclosures.",
  },
  {
    tactic: 'Security and Information Governance',
    legitimateTechnique:
      'Security protocols and clearance actions based on verified risk, policy, and national security requirements.',
    retaliatoryTechnique:
      'Information blockade and clearance suspension used to prevent access, publication, or participation.',
  },
  {
    tactic: 'Formal Sanctions',
    legitimateTechnique:
      'Proportionate corrective action for substantiated violations with consistent standards.',
    retaliatoryTechnique:
      'Pretextual discipline for minor infractions while comparable behavior by others is ignored.',
  },
  {
    tactic: 'Performance Evaluation',
    legitimateTechnique:
      'Objective appraisals tied to documented results, role expectations, and review criteria.',
    retaliatoryTechnique:
      'Deflated ratings after protected activity to block advancement, bonuses, or promotions.',
  },
  {
    tactic: 'Legal and Confidentiality Controls',
    legitimateTechnique:
      'NDA and confidentiality practices narrowly scoped to protect proprietary or legally sensitive information.',
    retaliatoryTechnique:
      'Overbroad gag directives that misstate NDA scope to silence lawful reporting.',
  },
  {
    tactic: 'Professional Standing',
    legitimateTechnique:
      'Reference and communication practices grounded in verified performance history.',
    retaliatoryTechnique:
      'Blacklisting, rumor-spreading, and social silencing to undermine reputation and future opportunities.',
  },
]

/**
 * Displays a tactics-and-techniques matrix inspired by ATT&CK-style structure.
 *
 * @returns A section containing the disciplinary tactics matrix table.
 */
export default function DisciplinaryTacticsSection() {
  return (
    <section id="t-and-t" className="mt-8 md:mt-12 pt-8 pb-8 mb-8 md:mb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="glass-effect rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-3">
              <span className="text-california-blue">Disciplinary</span>{' '}
              <span className="text-emergency-orange">Tactics &amp; Techniques</span>
            </h2>
            <p className="text-gray-700 max-w-3xl mx-auto text-base md:text-lg leading-relaxed">
              This matrix maps common administrative tactics to legitimate accountability use cases and the retaliatory
              variants often used to suppress protected disclosures.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white/90">
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-[#262c5b] text-white">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold tracking-wide uppercase">Tactic</th>
                  <th className="px-4 py-3 text-sm font-semibold tracking-wide uppercase">
                    Legitimate Technique (Accountability)
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold tracking-wide uppercase">
                    Retaliatory Technique (Silencing)
                  </th>
                </tr>
              </thead>
              <tbody>
                {disciplinaryMatrixRows.map((row) => (
                  <tr key={row.tactic} className="border-t border-gray-200 align-top">
                    <td className="px-4 py-4 font-semibold text-[#1f2b5a]">{row.tactic}</td>
                    <td className="px-4 py-4 text-gray-800 leading-relaxed">{row.legitimateTechnique}</td>
                    <td className="px-4 py-4 text-gray-800 leading-relaxed">{row.retaliatoryTechnique}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
