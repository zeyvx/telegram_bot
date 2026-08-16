export function formatMemberProfile(member: {
  username?: string | null;
  displayName: string;
  roles: string[];
  level: number;
  xp: number;
  warnings: number;
  joinedAt: Date | string;
}) {
  const username = member.username ? `@${member.username}` : member.displayName;
  const roles = member.roles.length ? member.roles.map((role) => `• ${role}`).join("\n") : "• Участник";
  const joined = new Date(member.joinedAt).toLocaleDateString("ru-RU");
  return [
    `👤 ${username}`,
    "",
    `Роли:\n${roles}`,
    "",
    `Уровень: ${member.level}`,
    `XP: ${member.xp}`,
    `Предупреждений: ${member.warnings}`,
    `В сообществе с: ${joined}`
  ].join("\n");
}
