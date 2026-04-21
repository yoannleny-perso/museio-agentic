
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const styles = {
  container: {
    padding: '2rem',
    fontFamily: 'Arial, sans-serif',
    color: '#333',
    maxWidth: '960px',
    margin: '0 auto',
    lineHeight: '1.6',
  },
  heading1: {
    fontSize: '2rem',
    marginTop: '3rem',
    color: '#111',
    borderBottom: '2px solid #ccc',
    paddingBottom: '0.5rem',
  },
  heading2: {
    fontSize: '1.5rem',
    marginTop: '2rem',
    color: '#222',
  },
  paragraph: {
    marginTop: '1rem',
  },
  list: {
    paddingLeft: '1.5rem',
    marginTop: '0.5rem',
  },
  listItem: {
    marginBottom: '0.5rem',
  },
  link: {
    color: '#0066cc',
    textDecoration: 'none',
  },
  hr: {
    margin: '3rem 0',
    border: 'none',
    borderTop: '1px solid #ddd',
  },
};

const TermsAndPrivacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="px-6 py-4 border-b bg-white">
        <div className="container mx-auto max-w-4xl flex items-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Home
          </button>
        </div>
      </header>

      {/* Content */}
       (
    <div style={styles.container}>
      <h1 style={styles.heading1}>Privacy Policy – MUSEIO</h1>
      <p style={styles.paragraph}><strong>Last Modified:</strong> 23/06/2025</p>
      <p style={styles.paragraph}>
        This Privacy Policy ("Policy") of MUSEIO a product of Audacian Group Pty Ltd ("MUSEIO," "we," "our," or "us") describes how we collect,
        use, disclose, and safeguard your personal information when you use our mobile application, web-based tools,
        and related services (collectively, the "Services").
      </p>

      <h2 style={styles.heading2}>1. Acceptance of Terms</h2>
      <p style={styles.paragraph}>
        By using our Services, you confirm that you accept the practices described in this Policy. If you do not agree
        with any part of this Policy, please discontinue use of the Services immediately.
      </p>

      <h2 style={styles.heading2}>2. Changes to This Policy</h2>
      <p style={styles.paragraph}>
        We may revise this Policy from time to time. When we make material changes, we will update the "Last Modified"
        date and may notify you as required by law. Please review this Policy regularly.
      </p>

      <h2 style={styles.heading2}>3. Types of Information We Collect</h2>
      <ul style={styles.list}>
        <li style={styles.listItem}><strong>Contact Data:</strong> Name, business name, email address, phone number, physical address.</li>
        <li style={styles.listItem}><strong>Profile Data:</strong> Username, password, DJ name or stage name, business info.</li>
        <li style={styles.listItem}><strong>User Data:</strong> Client contact and booking details.</li>
        <li style={styles.listItem}><strong>Gig & Invoice Data:</strong> Booking dates, gig locations, client notes, invoice totals, tax rates, payment statuses.</li>
        <li style={styles.listItem}><strong>Device & Technical Data:</strong> IP address, device ID, browser type, OS, crash logs.</li>
        <li style={styles.listItem}><strong>Support & Feedback Data:</strong> Support chats, surveys, or user feedback.</li>
        <li style={styles.listItem}><strong>Cookies & Tracking:</strong> Cookies or similar technologies may be used on our website.</li>
      </ul>

      <h2 style={styles.heading2}>4. How We Use Information</h2>
      <ul style={styles.list}>
        <li style={styles.listItem}>Provide and maintain the Services</li>
        <li style={styles.listItem}>Facilitate bookings and invoicing</li>
        <li style={styles.listItem}>Provide customer support</li>
        <li style={styles.listItem}>Send notifications and updates</li>
        <li style={styles.listItem}>Improve app performance and functionality</li>
        <li style={styles.listItem}>Ensure platform security</li>
      </ul>

      <h2 style={styles.heading2}>5. How We Share Information</h2>
      <ul style={styles.list}>
        <li style={styles.listItem}>With service providers (e.g., cloud storage)</li>
        <li style={styles.listItem}>With your consent</li>
        <li style={styles.listItem}>As required by law (e.g., for audits, legal investigations)</li>
        <li style={styles.listItem}>In the context of business transfers (e.g., merger or acquisition)</li>
      </ul>

      <h2 style={styles.heading2}>6. Data Retention</h2>
      <p style={styles.paragraph}>
        We retain data as long as necessary to provide Services and meet legal or operational requirements. You may
        request deletion of your data by contacting us.
      </p>

      <h2 style={styles.heading2}>7. Your Rights</h2>
      <ul style={styles.list}>
        <li style={styles.listItem}>Access and correct your data</li>
        <li style={styles.listItem}>Request deletion of your data</li>
        <li style={styles.listItem}>Export your data in a portable format</li>
        <li style={styles.listItem}>Withdraw consent for marketing</li>
      </ul>

      <h2 style={styles.heading2}>8. International Transfers</h2>
      <p style={styles.paragraph}>
        Data may be stored and processed outside your country. By using our Services, you consent to such transfers.
      </p>

      <h2 style={styles.heading2}>9. Minors</h2>
      <p style={styles.paragraph}>
        MUSEIO is not intended for individuals under 18. We do not knowingly collect data from minors.
      </p>

      <h2 style={styles.heading2}>10. Security</h2>
      <p style={styles.paragraph}>
        We implement industry-standard security measures but cannot guarantee complete security. Use the Services at
        your own risk.
      </p>

      <h2 style={styles.heading2}>11. Contact Us</h2>
      <p style={styles.paragraph}>
        Audacian Group Pty Ltd<br />
        Email: <a href="mailto:privacy@museioapp.com" style={styles.link}>privacy@museioapp.com</a>
      </p>

      <hr style={styles.hr} />

      <h1 style={styles.heading1}>Terms of Service – MUSEIO</h1>
      <p style={styles.paragraph}><strong>Last Updated:</strong> 23/06/2025</p>
      <p style={styles.paragraph}>
        Welcome to MUSEIO. By using our mobile and web-based services (the "Services"), you agree to be bound by these
        Terms of Service ("Terms"). If you do not agree, do not use the Services.
      </p>

      <h2 style={styles.heading2}>1. Use of Services</h2>
      <p style={styles.paragraph}>
        You may use our Services only if you are 18 years or older and capable of forming a binding contract. You agree
        not to use the Services for any unlawful or prohibited purpose.
      </p>

      <h2 style={styles.heading2}>2. Accounts and Access</h2>
      <p style={styles.paragraph}>
        You are responsible for maintaining the confidentiality of your login credentials. You agree to notify us
        immediately of any unauthorized access to your account.
      </p>

      <h2 style={styles.heading2}>3. Content and Ownership</h2>
      <p style={styles.paragraph}>
        You retain ownership of the data you upload or create. MUSEIO owns all rights to the platform itself, including
        designs, interfaces, and software.
      </p>

      <h2 style={styles.heading2}>4. Termination</h2>
      <p style={styles.paragraph}>
        We may suspend or terminate your account at any time for violation of these Terms or for any other reason.
      </p>

      <h2 style={styles.heading2}>5. Disclaimer and Limitation of Liability</h2>
      <p style={styles.paragraph}>
        The Services are provided "as is" without warranties of any kind. We are not liable for any damages arising from
        your use of the Services.
      </p>

      <h2 style={styles.heading2}>7. Governing Law</h2>
      <p style={styles.paragraph}>
        These Terms are governed by the laws of New South Wales, Australia. Disputes shall be resolved in the courts of
        that jurisdiction.
      </p>

      <h2 style={styles.heading2}>8. Contact</h2>
      <p style={styles.paragraph}>
        Email: <a href="mailto:support@museioapp.com" style={styles.link}>support@museioapp.com</a>
      </p>

      <hr style={styles.hr} />

      <h1 style={styles.heading1}>End User License Agreement (EULA) – MUSEIO</h1>
      <p style={styles.paragraph}>
        This EULA governs your use of the MUSEIO mobile and web applications. By installing or using the app, you agree to this agreement.
      </p>
      <ul style={styles.list}>
        <li style={styles.listItem}>The app is licensed, not sold.</li>
        <li style={styles.listItem}>You may not reverse-engineer, decompile, or tamper with the software.</li>
        <li style={styles.listItem}>MUSEIO may update the software automatically.</li>
        <li style={styles.listItem}>Breach of this EULA may result in termination of access.</li>
      </ul>

      <hr style={styles.hr} />

      <h1 style={styles.heading1}>Cookie Policy – MUSEIO</h1>
      <p style={styles.paragraph}>
        MUSEIO uses cookies and similar technologies to enhance your experience and improve our Services.
      </p>

      <h2 style={styles.heading2}>What We Collect</h2>
      <p style={styles.paragraph}>Session cookies for login and authentication</p>

      <h2 style={styles.heading2}>Managing Cookies</h2>
      <p style={styles.paragraph}>
        You can control cookie settings through your browser preferences. Disabling cookies may affect functionality.
      </p>

      <h2 style={styles.heading2}>More Information</h2>
      <p style={styles.paragraph}>
        Contact us at <a href="mailto:privacy@museioapp.com" style={styles.link}>privacy@museioapp.com</a> for details.
      </p>
    </div>

      {/* Footer */}
      <footer className="mt-12 px-6 py-6 text-center text-gray-500 text-sm bg-white border-t">
        <p>&copy; {new Date().getFullYear()} Museio by Audacian Group Pty Ltd. All rights reserved.</p>
      </footer>
  </div>
  );
};

export default TermsAndPrivacy;
