using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NeoBank.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCreditLimitToCards : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CreditLimit",
                table: "Cards",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreditLimitUpdatedAt",
                table: "Cards",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreditLimit",
                table: "Cards");

            migrationBuilder.DropColumn(
                name: "CreditLimitUpdatedAt",
                table: "Cards");
        }
    }
}
