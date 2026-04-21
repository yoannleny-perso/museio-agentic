// Create the HTML email content
export const createJobConfirmationEmail = (data)=>{
  const { job, artist } = data;
  return generateEmailHtml(job, artist);
};
// Generate email content based on action and data
export function generateEmailHtml(job, artist) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MUSEIO Email Templates</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #ffffff;
    }
    .logo-container {
      text-align: center;
      padding: 20px 0;
      background-color: #ffffff;
    }
    .logo-container img {
      max-width: 200px;
      height: auto;
      width: auto;
      max-height: 80px;
    }
    .email-section {
      margin: 0 auto 40px;
      max-width: 620px;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }
    .email-header {
      background: linear-gradient(90deg, #E9D5FF 0%, #DDD6FE 100%);
      padding: 24px 24px 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .email-brand {
      font-weight: bold;
      font-size: 24px;
      color: #ffffff;
    }
    .email-logo {
      max-width: 120px;
      max-height: 60px;
      width: auto;
      height: auto;
    }
    .email-meta {
      text-align: right;
      font-size: 14px;
      color: #374151;
    }
    .email-body {
      background-color: #ffffff;
      padding: 24px;
    }
    .email-body h3 {
      font-size: 20px;
      margin-bottom: 12px;
      color: #111827;
      background-color: #ffffff;

    }
    .email-body p {
      font-size: 15px;
      color: #4B5563;
      margin-bottom: 20px;
      background-color: #ffffff;

    }
    .email-body ul {
      list-style: none;
      padding: 0;
      font-size: 15px;
      color: #111827;
      line-height: 1.8;
      background-color: #ffffff;

    }
    .email-body ul li strong {
      color: #111827;
    }
    .email-footer {
      padding: 24px;
      font-size: 13px;
      color: #6B7280;
      text-align: center;
      background-color: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }
    @media only screen and (max-width: 600px) {
      .logo-container img {
        max-width: 150px;
        max-height: 60px;
      }
      .email-header {
        flex-direction: column;
        align-items: flex-start;
      }
      .email-meta {
        text-align: left;
        margin-top: 10px;
      }
      .email-logo {
        max-width: 100px;
        max-height: 50px;
        margin-top: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="logo-container">
    <img 
      src="https://museioapp.com/museio-gradient-logo.svg" 
      alt="Museio Logo"
    />
  </div>
  <section class="email-section">
    <div class="email-header" style="background: linear-gradient(90deg, #DBEAFE 0%, #BFDBFE 100%);">
      <div class="email-meta" style="text-align: left;">
        <div style="font-size: 22px; font-weight: bold; margin-bottom: 8px;">Job Confirmed</div>
        <div style="font-size: 14px; color: #4B5563;">${job.formattedDate}</div>
        <div style="font-size: 14px; color: #4B5563; font-weight: bold;">Total: A$${job.total}</div>
      </div>
    </div>
    <div class="email-body">
      <h3>✅ Congratulation, a new job is coming your way!</h3>
      <p>A new job has been successfully created and confirmed. Here are the details:</p>
      <ul>
        <li><strong>Event:</strong> ${job.title}</li>
        <li><strong>Date:</strong> ${job.formattedDate} </li>
        <li><strong>Time:</strong> ${job.start_time} – ${job.end_time}</li>
        <li><strong>Location:</strong> ${job.location} </li>
        <li><strong>Name:</strong> ${artist.name} </li>
        <li><strong>Email:</strong> <a href="mailto:${artist.email}">${artist.email}</a></li>
        ${artist.phone ? `<li><strong>Phone:</strong> ${artist.phone}</li>` : ''}
      </ul>
      <p>If you have any questions or need to make further changes, please reach out to ${artist.name}.</p>
      <p>Best regards,<br>
      <strong>Museio Team</strong><br>
      <a href="mailto:support@museioapp.com">support@museioapp.com</a></p>
    </div>
    <div class="email-footer">
      <a href="https://museioapp.com/" style="
        display: inline-block;
        margin-top: 0;
        padding: 10px 18px;
        background: linear-gradient(90deg, #D8B4FE 0%, #C084FC 100%);
        color: #ffffff;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 500;
        font-size: 14px;
        margin-bottom: 12px;">Discover Museio</a>
      <p style="margin-top: 8px; font-size: 13px; color: #6B7280;">
        <span style="font-size: 13px; font-weight: 500;">Transform your <strong>Passion</strong> into a <strong>Business</strong></span>
      </p>
      <p style="margin-top: 16px; font-size: 13px; color: #6B7280;">
        <span style="font-size: 12px;">This email was automatically generated by <strong>MuseioApp</strong>.</span>
      </p>
    </div>
  </section>
</body>
</html>
    `;
}
