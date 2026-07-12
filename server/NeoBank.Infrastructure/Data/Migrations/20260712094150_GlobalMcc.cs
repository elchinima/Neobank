using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NeoBank.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class GlobalMcc : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CashbackMccs_CashbackCategories_CategoryId",
                table: "CashbackMccs");

            migrationBuilder.DropIndex(
                name: "IX_CashbackMccs_CategoryId",
                table: "CashbackMccs");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "CashbackMccs");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "CashbackMccs",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<List<string>>(
                name: "MccCodes",
                table: "CashbackCategories",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'::text[]");

            migrationBuilder.CreateIndex(
                name: "IX_CashbackMccs_Code",
                table: "CashbackMccs",
                column: "Code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CashbackMccs_Code",
                table: "CashbackMccs");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "CashbackMccs");

            migrationBuilder.DropColumn(
                name: "MccCodes",
                table: "CashbackCategories");

            migrationBuilder.AddColumn<string>(
                name: "CategoryId",
                table: "CashbackMccs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_CashbackMccs_CategoryId",
                table: "CashbackMccs",
                column: "CategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_CashbackMccs_CashbackCategories_CategoryId",
                table: "CashbackMccs",
                column: "CategoryId",
                principalTable: "CashbackCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
