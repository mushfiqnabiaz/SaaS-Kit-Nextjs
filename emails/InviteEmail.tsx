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
import { PUBLIC_APP_NAME } from "@/lib/app-config";

interface InviteEmailProps {
  inviteUrl: string;
  companyName: string;
}

export function InviteEmail({ inviteUrl, companyName }: InviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You&apos;ve been invited to join {companyName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Join {companyName} on {PUBLIC_APP_NAME}</Heading>
          <Text style={text}>
            You&apos;ve been invited to collaborate. Click below to accept your invitation and
            create your account.
          </Text>
          <Button href={inviteUrl} style={button}>
            Accept invitation
          </Button>
          <Text style={muted}>This link expires in 48 hours.</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#0f1419", fontFamily: "sans-serif" };
const container = { margin: "0 auto", padding: "32px", maxWidth: "520px" };
const heading = { color: "#f4f4f5", fontSize: "22px", fontWeight: "600" };
const text = { color: "#a1a1aa", fontSize: "14px", lineHeight: "24px" };
const muted = { color: "#71717a", fontSize: "12px", marginTop: "24px" };
const button = {
  backgroundColor: "#3b82f6",
  color: "#fff",
  padding: "12px 24px",
  borderRadius: "8px",
  fontWeight: "600",
  textDecoration: "none",
};

export default InviteEmail;
