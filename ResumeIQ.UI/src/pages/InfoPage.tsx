type Props = {
    onBack: () => void
}

const steps = [
    {
        number: '1',
        title: 'Upload your resume',
        description: 'Go to "My Resumes" and upload your resume in PDF or DOCX format (up to 10 MB). You can upload multiple versions and mark one as preferred.',
    },
    {
        number: '2',
        title: 'Add a job application',
        description: 'Click "+ Add Application" on the dashboard. Enter the company name, role title, applied date, and paste in the full job description.',
    },
    {
        number: '3',
        title: 'Run AI analysis',
        description: 'Open the application and click "Analyse Resume". ResumeIQ compares your resume against the job description and gives you a match score, missing keywords, and improved bullet points.',
    },
    {
        number: '4',
        title: 'Generate a cover letter',
        description: 'Click "Generate Cover Letter" to get a tailored cover letter for the role. You can copy it to your clipboard with one click.',
    },
    {
        number: '5',
        title: 'Track your progress',
        description: 'Update the status of each application (Applied, Interview, Offer, Rejected) as you progress. The dashboard shows a summary of all your applications at a glance.',
    },
]

const faqs = [
    {
        q: 'What file types can I upload?',
        a: 'PDF and DOCX files are supported, up to 10 MB each.',
    },
    {
        q: 'Can I have more than one resume?',
        a: 'Yes. You can upload multiple resumes — for example, different versions tailored to different industries. Mark one as "Preferred" and that is the one used for AI analysis and cover letter generation.',
    },
    {
        q: 'Which resume does the AI use?',
        a: 'The resume marked as "Preferred". If none is set as preferred, it falls back to the most recently uploaded one.',
    },
    {
        q: 'How do I set a preferred resume?',
        a: 'Go to "My Resumes" from the navbar. Each resume that is not already preferred has a "Set as Preferred" button. Click it and it becomes your active resume for AI features.',
    },
    {
        q: 'What does the match score mean?',
        a: 'It is a percentage indicating how closely your resume aligns with the job description — based on skills, keywords, and language. A higher score means your resume is a stronger match for that role.',
    },
    {
        q: 'How does the AI analysis work?',
        a: 'ResumeIQ uses Claude (Anthropic\'s AI model) to compare your resume text against the job description. It identifies keywords present in the job description that are missing from your resume, and suggests stronger bullet points using the language employers are looking for.',
    },
    {
        q: 'Can I re-run the analysis?',
        a: 'Yes. Click "Re-analyse" at any time — for example after updating your resume or if you want a fresh result.',
    },
    {
        q: 'Is my data secure?',
        a: 'Yes. ResumeIQ uses Microsoft authentication (your existing Microsoft account). Your resumes are stored privately in Azure Blob Storage and are only accessible to you. No data is shared with third parties.',
    },
]

export default function InfoPage({ onBack }: Props) {
    return (
        <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
            <nav style={{
                background: '#4c1d95', padding: '0 2rem', height: '64px',
                display: 'flex', alignItems: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}>
                <span style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>ResumeIQ</span>
            </nav>

            <div style={{ padding: '2rem', maxWidth: '760px', margin: '0 auto' }}>
                <button onClick={onBack} style={{ background: 'none', color: '#6d28d9', fontWeight: 600, padding: '0 0 1.25rem', fontSize: '0.9rem' }}>
                    ← Back to Applications
                </button>

                {/* How it works */}
                <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: '0 0 1.75rem', fontSize: '1.3rem', color: '#1f2937' }}>How it works</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {steps.map(step => (
                            <div key={step.number} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                                <div style={{
                                    flexShrink: 0, width: '2rem', height: '2rem',
                                    background: '#7c3aed', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontWeight: 700, fontSize: '0.85rem',
                                }}>
                                    {step.number}
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 0.25rem', fontWeight: 600, color: '#111827', fontSize: '0.95rem' }}>{step.title}</p>
                                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6 }}>{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQ */}
                <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <h2 style={{ margin: '0 0 1.75rem', fontSize: '1.3rem', color: '#1f2937' }}>Frequently asked questions</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {faqs.map((faq, i) => (
                            <div key={i} style={{ borderBottom: i < faqs.length - 1 ? '1px solid #f3f4f6' : 'none', paddingBottom: i < faqs.length - 1 ? '1.25rem' : 0 }}>
                                <p style={{ margin: '0 0 0.4rem', fontWeight: 600, color: '#111827', fontSize: '0.95rem' }}>{faq.q}</p>
                                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6 }}>{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
