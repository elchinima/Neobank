using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace NeoBank.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddFooterSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "MediaText",
                table: "PublicPageSettings",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.CreateTable(
                name: "FooterSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Category = table.Column<string>(type: "text", nullable: false),
                    Key = table.Column<string>(type: "text", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: true),
                    Url = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FooterSettings", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "FooterSettings",
                columns: new[] { "Id", "Category", "Key", "Url", "Value" },
                values: new object[,]
                {
                    { 1, "Contact", "address", "https://maps.google.com/?q=Baku%2C%20Azerbaijan", "Baku, Azerbaijan" },
                    { 2, "Contact", "email", "mailto:support@neobank.az", "support@neobank.az" },
                    { 3, "Contact", "phone", "tel:+994125554545", "+994 12 555 45 45" },
                    { 4, "Social", "Facebook", "https://www.facebook.com/", "Facebook" },
                    { 5, "Social", "X", "https://x.com/", "X" },
                    { 6, "Social", "LinkedIn", "https://www.linkedin.com/", "LinkedIn" },
                    { 7, "Social", "Instagram", "https://www.instagram.com/", "Instagram" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FooterSettings");

            migrationBuilder.AlterColumn<string>(
                name: "MediaText",
                table: "PublicPageSettings",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }
    }
}
