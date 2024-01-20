require("dotenv").config();
import nodeMailer, {Transporter} from "nodemailer"
import ejs from 'ejs';
import path from "path";

interface EmailOptions{
    email: string;
    subject: string;
    template: string;
    data: {[key:string]: any}
}

const sendMail = async (options: EmailOptions) => {
    const transporter: Transporter = nodeMailer.createTransport({
        host: process.env.SMPT_HOST,
        port: parseInt(process.env.SMPT_PORT || '587') ,
        service: process.env.SMPT_SERVICE,
        auth:{
            user: process.env.SMPT_MAIL,
            pass: process.env.SMPT_PASSWORD,
        },
    });

    const {email, subject, template, data} = options

    const templatePath = path.join(__dirname, "../mails", template)

    const html:string = await ejs.renderFile(templatePath, data)

    const mailOptions = {
        from: process.env.SMPT_MAIL,
        to: options.email,
        subject,
        html
    }

    await transporter.sendMail(mailOptions)
}

export default sendMail;

    