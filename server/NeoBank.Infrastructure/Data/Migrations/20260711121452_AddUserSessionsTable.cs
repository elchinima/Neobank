using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NeoBank.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUserSessionsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Step 1: Create UserSessions table first
            migrationBuilder.CreateTable(
                name: "UserSessions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    RegistrationIp = table.Column<string>(type: "text", nullable: true),
                    LastIp = table.Column<string>(type: "text", nullable: true),
                    LastLoginAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsEmailVerified = table.Column<bool>(type: "boolean", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    IsSubscribedToNewsletter = table.Column<bool>(type: "boolean", nullable: false),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserSessions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserSessions_UserId",
                table: "UserSessions",
                column: "UserId",
                unique: true);

            // Step 2: Migrate existing data from Users to UserSessions
            migrationBuilder.Sql(@"
                INSERT INTO ""UserSessions"" (
                    ""Id"",
                    ""UserId"",
                    ""RegistrationIp"",
                    ""LastIp"",
                    ""LastLoginAt"",
                    ""CreatedAt"",
                    ""IsEmailVerified"",
                    ""TwoFactorEnabled"",
                    ""IsSubscribedToNewsletter"",
                    ""Note""
                )
                SELECT
                    gen_random_uuid()::text,
                    ""Id"",
                    ""RegistrationIp"",
                    ""LastIp"",
                    ""LastLoginAt"",
                    ""CreatedAt"",
                    ""IsEmailVerified"",
                    ""TwoFactorEnabled"",
                    ""IsSubscribedToNewsletter"",
                    ""Note""
                FROM ""Users"";
            ");

            // Step 3: Drop columns from Users AFTER data is safely migrated
            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsEmailVerified",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsSubscribedToNewsletter",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LastIp",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LastLoginAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Note",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "RegistrationIp",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TwoFactorEnabled",
                table: "Users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserSessions");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "IsEmailVerified",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsSubscribedToNewsletter",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "LastIp",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastLoginAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Note",
                table: "Users",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RegistrationIp",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "TwoFactorEnabled",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
