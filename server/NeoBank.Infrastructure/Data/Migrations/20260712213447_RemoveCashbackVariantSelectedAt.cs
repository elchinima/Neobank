using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NeoBank.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveCashbackVariantSelectedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CashbackVariantSelectedAt",
                table: "UserSessions");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CashbackVariantSelectedAt",
                table: "UserSessions",
                type: "timestamp with time zone",
                nullable: true);
        }
    }
}
