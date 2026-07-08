using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NeoBank.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class CapitalizeFooterContactKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "FooterSettings",
                keyColumn: "Id",
                keyValue: 1,
                column: "Key",
                value: "Address");

            migrationBuilder.UpdateData(
                table: "FooterSettings",
                keyColumn: "Id",
                keyValue: 2,
                column: "Key",
                value: "Email");

            migrationBuilder.UpdateData(
                table: "FooterSettings",
                keyColumn: "Id",
                keyValue: 3,
                column: "Key",
                value: "Phone");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "FooterSettings",
                keyColumn: "Id",
                keyValue: 1,
                column: "Key",
                value: "address");

            migrationBuilder.UpdateData(
                table: "FooterSettings",
                keyColumn: "Id",
                keyValue: 2,
                column: "Key",
                value: "email");

            migrationBuilder.UpdateData(
                table: "FooterSettings",
                keyColumn: "Id",
                keyValue: 3,
                column: "Key",
                value: "phone");
        }
    }
}
