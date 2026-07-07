using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace NeoBank.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class MergePublicPageSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PublicPageSettingTranslations");

            migrationBuilder.DropIndex(
                name: "IX_PublicPageSettings_PageKey",
                table: "PublicPageSettings");

            migrationBuilder.RenameColumn(
                name: "PageKey",
                table: "PublicPageSettings",
                newName: "PageName");

            migrationBuilder.AddColumn<string>(
                name: "BannerImageUrl",
                table: "PublicPageSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LanguageCode",
                table: "PublicPageSettings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "MediaText",
                table: "PublicPageSettings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "PublicPageSettings",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_PublicPageSettings_PageName_LanguageCode",
                table: "PublicPageSettings",
                columns: new[] { "PageName", "LanguageCode" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PublicPageSettings_PageName_LanguageCode",
                table: "PublicPageSettings");

            migrationBuilder.DropColumn(
                name: "BannerImageUrl",
                table: "PublicPageSettings");

            migrationBuilder.DropColumn(
                name: "LanguageCode",
                table: "PublicPageSettings");

            migrationBuilder.DropColumn(
                name: "MediaText",
                table: "PublicPageSettings");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "PublicPageSettings");

            migrationBuilder.RenameColumn(
                name: "PageName",
                table: "PublicPageSettings",
                newName: "PageKey");

            migrationBuilder.CreateTable(
                name: "PublicPageSettingTranslations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PublicPageSettingId = table.Column<int>(type: "integer", nullable: false),
                    BannerImageUrl = table.Column<string>(type: "text", nullable: true),
                    LanguageCode = table.Column<string>(type: "text", nullable: false),
                    MediaText = table.Column<string>(type: "text", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PublicPageSettingTranslations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PublicPageSettingTranslations_PublicPageSettings_PublicPage~",
                        column: x => x.PublicPageSettingId,
                        principalTable: "PublicPageSettings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PublicPageSettings_PageKey",
                table: "PublicPageSettings",
                column: "PageKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PublicPageSettingTranslations_PublicPageSettingId_LanguageC~",
                table: "PublicPageSettingTranslations",
                columns: new[] { "PublicPageSettingId", "LanguageCode" },
                unique: true);
        }
    }
}
