const fs = require('fs');

const users = [
  { num: 1, firstName: 'Divine', email: 'evanchenthesurgeon@gmail.com', password: '0;U;q_*DL]e9oFuv', file: '1-divine-evanchenthesurgeon' },
  { num: 2, firstName: 'Divine', email: 'classicosonic7@gmail.com', password: '5j|T<=wKO(+IA?{a', file: '2-divine-classicosonic7' },
  { num: 3, firstName: 'Osayande', email: 'benardgregory935@gmail.com', password: 'I$.d=iiU8v<[NNHW', file: '3-osayande-benardgregory935' },
  { num: 4, firstName: 'Minloveth', email: 'lovethowenaze85@gmail.com', password: 'd%9]BOaX:t2p5*aC', file: '4-minloveth-lovethowenaze85' },
  { num: 5, firstName: 'Cha', email: 'omofowaaroma@gmail.com', password: 's@uvN|u)#wa.92u4', file: '5-cha-omofowaaroma' },
  { num: 6, firstName: 'OSEMWENGIE', email: 'ehizpraize58@gmail.com', password: 'w^H3uQ-0k?GJT51.', file: '6-osemwengie-ehizpraize58' },
  { num: 7, firstName: 'Osas', email: 'osasokunrobo1@gmail.com', password: 'Q8HbP^@5=9oiBH+%', file: '7-osas-osasokunrobo1' }
];

const htmlTemplate = (firstName, email, password) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edo Talent Hunt - Account Activated</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1a472a 0%, #2d5f3d 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                                Edo Talent Hunt
                            </h1>
                            <p style="color: #e0e0e0; margin: 10px 0 0 0; font-size: 16px;">
                                Account Activation Notification
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">
                                Welcome Back, ${firstName}!
                            </h2>
                            
                            <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                                Great news! Your account has been successfully activated and is now ready to use.
                            </p>
                            
                            <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                                Please use the credentials below to log in:
                            </p>
                            
                            <!-- Credentials Box -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9f9f9; border: 2px solid #1a472a; border-radius: 8px; margin: 30px 0;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <strong style="color: #333333; font-size: 14px;">Email:</strong>
                                                </td>
                                                <td style="padding: 8px 0; text-align: right;">
                                                    <span style="color: #1a472a; font-size: 14px; font-weight: 600;">${email}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <strong style="color: #333333; font-size: 14px;">Password:</strong>
                                                </td>
                                                <td style="padding: 8px 0; text-align: right;">
                                                    <code style="background-color: #ffffff; padding: 8px 12px; border-radius: 4px; color: #d9534f; font-size: 16px; font-weight: bold; border: 1px solid #e0e0e0;">${password}</code>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Login Button -->
                            <table role="presentation" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="https://edotalenthunt.com/login" style="display: inline-block; background-color: #1a472a; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; transition: background-color 0.3s;">
                                            Login to Your Account
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #666666; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
                                If you have any questions or need assistance, please don't hesitate to contact our support team.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0 0 10px 0; font-size: 14px;">
                                Edo Talent Hunt - Showcasing Edo State's Finest Talents
                            </p>
                            <p style="color: #999999; margin: 0; font-size: 12px;">
                                © 2025 Edo Talent Hunt. All rights reserved.
                            </p>
                            <p style="color: #999999; margin: 15px 0 0 0; font-size: 12px;">
                                This is an automated message. Please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

users.forEach(user => {
  const html = htmlTemplate(user.firstName, user.email, user.password);
  fs.writeFileSync(`emails/${user.file}.html`, html);
  console.log(`✅ Created emails/${user.file}.html`);
});

console.log('\n✅ All HTML emails generated successfully!');

