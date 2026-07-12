using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NeoBank.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCashbackVariantToUserSession : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CashbackVariant",
                table: "UserSessions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CashbackVariantSelectedAt",
                table: "UserSessions",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CashbackVariant",
                table: "UserSessions");

            migrationBuilder.DropColumn(
                name: "CashbackVariantSelectedAt",
                table: "UserSessions");
        }
    }
}
