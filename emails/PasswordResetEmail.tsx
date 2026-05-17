import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import { APP_NAME } from "@/config/constants";

interface PasswordResetEmailProps {
  resetUrl: string;
  name: string;
}

export function PasswordResetEmail({ resetUrl, name }: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your {APP_NAME} password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Reset your password</Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            We received a request to reset your password. Click the button below to choose a new
            one. This link expires in 1 hour.
          </Text>
          <Button href={resetUrl} style={button}>
            Reset password
          </Button>
          <Text style={muted}>
            If you did not request this, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f6f9fc", fontFamily: "sans-serif" };
const container = { margin: "0 auto", padding: "32px", maxWidth: "520px" };
const heading = { fontSize: "22px", fontWeight: "600", color: "#111" };
const text = { fontSize: "14px", lineHeight: "24px", color: "#444" };
const muted = { color: "#71717a", fontSize: "12px", marginTop: "24px" };
const button = {
  backgroundColor: "#2563eb",
  color: "#fff",
  padding: "12px 24px",
  borderRadius: "8px",
  fontWeight: "600",
  textDecoration: "none",
};

export default PasswordResetEmail;
